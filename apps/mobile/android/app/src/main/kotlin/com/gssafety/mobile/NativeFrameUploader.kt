package com.gssafety.mobile

import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import android.os.SystemClock
import android.util.Base64
import okhttp3.Call
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.BufferedSink
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InterruptedIOException
import java.net.URI
import java.net.URL
import java.time.Instant
import java.time.OffsetDateTime
import java.util.Locale
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.RejectedExecutionException
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.math.abs
import kotlin.math.roundToLong

class NativeFrameUploader internal constructor(
    args: Map<String, Any?>,
    private val onEvent: (Map<String, Any?>) -> Unit,
    private val clockGuard: NativeClockGuard,
) {
    constructor(args: Map<String, Any?>, onEvent: (Map<String, Any?>) -> Unit) :
        this(args, onEvent, NativeClockGuard(System::currentTimeMillis, SystemClock::elapsedRealtimeNanos,
            if (args.containsKey("clockBaselineResidualMs")) requiredNumber(args, "clockBaselineResidualMs") else 0.0))

    private val uploadUrl = checkedUrl(requiredString(args, "uploadUrl"))
    private val cameraId = requiredString(args, "cameraId")
    private val deviceId = requiredString(args, "deviceId")
    private val runId = requiredString(args, "runId")
    private val clockOffsetMs = requiredNumber(args, "clockOffsetMs")
    private val clockUncertaintyMs = requiredNumber(args, "clockUncertaintyMs").also {
        require(it >= 0) { "clockUncertaintyMs must not be negative" }
    }
    private val clockSynchronizedAt = requiredString(args, "clockSynchronizedAt").also {
        require(runCatching { OffsetDateTime.parse(it) }.isSuccess) { "clockSynchronizedAt must be an ISO timestamp with timezone" }
    }
    private val clockOffsetNanos = (clockOffsetMs * 1_000_000).also {
        require(it.isFinite() && it > Long.MIN_VALUE.toDouble() && it < Long.MAX_VALUE.toDouble()) { "clockOffsetMs exceeds the supported timestamp range" }
    }.roundToLong()
    private val bearerToken = args["bearerToken"].let {
        require(it == null || it is String) { "bearerToken must be a string" }
        it?.also { token ->
            require(token.none { character -> character == '\r' || character == '\n' }) {
                "bearerToken must not contain line breaks"
            }
        }?.takeIf(String::isNotBlank)
    }
    private val closed = AtomicBoolean(false)
    private val clockChanged = AtomicBoolean(false)
    private val busy = AtomicBoolean(false)
    private val dropped = AtomicLong(0)
    private val uploaded = AtomicLong(0)
    private val errors = AtomicLong(0)
    private val sessionId = UUID.randomUUID().toString()
    private val startedNanos = SystemClock.elapsedRealtimeNanos()
    private val callLock = Any()
    private var activeCall: Call? = null
    private val executor = Executors.newSingleThreadExecutor { task ->
        Thread(task, "cctv-frame-uploader").apply { isDaemon = true }
    }

    fun isBusy(): Boolean = closed.get() || clockChanged.get() || busy.get()

    /** On acceptance, the caller transfers ownership of nv21 and must not mutate it. */
    fun submit(
        nv21: ByteArray,
        width: Int,
        height: Int,
        capturedAtMillis: Long,
        capturedElapsedNanos: Long,
        sequence: Long,
    ): Boolean {
        if (closed.get() || clockChanged.get() || !busy.compareAndSet(false, true)) {
            dropped.incrementAndGet()
            return false
        }
        try {
            executor.execute {
                try {
                    if (!closed.get()) {
                        val event = upload(nv21, width, height, capturedAtMillis,
                            capturedElapsedNanos, sequence)
                        if (!closed.get()) onEvent(event)
                    }
                } finally {
                    busy.set(false)
                }
            }
            return true
        } catch (_: RejectedExecutionException) {
            busy.set(false)
            dropped.incrementAndGet()
            return false
        }
    }

    fun close() {
        if (!closed.compareAndSet(false, true)) return
        val call = synchronized(callLock) {
            activeCall.also { activeCall = null }
        }
        call?.cancel()
        executor.shutdownNow()
    }

    private fun upload(
        frame: ByteArray, width: Int, height: Int, capturedAtMillis: Long,
        capturedElapsedNanos: Long, sequence: Long,
    ): Map<String, Any?> {
        val started = SystemClock.elapsedRealtimeNanos()
        val frameId = "$sessionId:$sequence"
        val capturedAt = Instant.ofEpochMilli(capturedAtMillis).plusNanos(clockOffsetNanos).toString()
        val captureResidualMs = clockGuard.residualMs(capturedAtMillis, capturedElapsedNanos)
        val captureClock = mapOf("deviceCapturedAt" to utc(capturedAtMillis), "offsetMs" to clockOffsetMs,
            "uncertaintyMs" to clockUncertaintyMs + abs(captureResidualMs), "synchronizedAt" to clockSynchronizedAt)
        val event = mutableMapOf<String, Any?>(
            "type" to "cctvFrame", "state" to "error", "sequence" to sequence,
            "frameId" to frameId, "cameraId" to cameraId, "deviceId" to deviceId,
            "runId" to runId, "streamId" to sessionId, "capturedAt" to capturedAt,
            "captureClock" to captureClock,
            "capturedElapsedNanos" to capturedElapsedNanos,
            "width" to width, "height" to height,
        )
        var call: Call? = null
        var requestStarted: Long? = null
        try {
            requireStableClock(capturedAtMillis, capturedElapsedNanos)
            requireStableClock()
            if (width <= 0 || height <= 0 || width % 2 != 0 || height % 2 != 0 ||
                frame.size.toLong() != width.toLong() * height / 2 * 3) {
                throw UploadFailure("invalid_frame", "Expected compact, even-sized NV21 data")
            }
            val jpeg = ByteArrayOutputStream().use { output ->
                if (!YuvImage(frame, ImageFormat.NV21, width, height, null)
                        .compressToJpeg(Rect(0, 0, width, height), 75, output)) {
                    throw UploadFailure("jpeg_encoding_failed", "JPEG encoding failed")
                }
                output.toByteArray()
            }
            event["encodeMs"] = elapsedMs(started)
            event["jpegBytes"] = jpeg.size
            val payload = JSONObject()
                .put("cameraId", cameraId).put("capturedAt", capturedAt)
                .put("captureClock", JSONObject(captureClock))
                .put("sequence", sequence).put("jpegBase64", Base64.encodeToString(jpeg, Base64.NO_WRAP))
                .put("frameId", frameId).put("deviceId", deviceId).put("runId", runId).put("streamId", sessionId)
                .put("capturedElapsedNanos", capturedElapsedNanos.toString())
                .put("width", width).put("height", height)
                .toString().toByteArray(Charsets.UTF_8)
            val body = object : RequestBody() {
                override fun contentType() = JSON_MEDIA_TYPE
                override fun contentLength() = payload.size.toLong()
                override fun isOneShot() = true
                override fun writeTo(sink: BufferedSink) {
                    var offset = 0
                    while (offset < payload.size) {
                        requireStableClock()
                        val count = minOf(16_384, payload.size - offset)
                        sink.write(payload, offset, count)
                        offset += count
                    }
                }
            }
            val request = Request.Builder().url(uploadUrl).post(body)
                .header("Accept", "application/json")
                .apply { bearerToken?.let { header("Authorization", "Bearer $it") } }
                .build()
            call = httpClient.newCall(request)
            synchronized(callLock) {
                if (closed.get()) throw UploadFailure("uploader_closed", "Uploader closed")
                activeCall = call
            }
            requestStarted = SystemClock.elapsedRealtimeNanos()
            requireStableClock()
            call.execute().use { response ->
                requireStableClock()
                event["httpStatus"] = response.code
                if (!response.isSuccessful) {
                    throw UploadFailure("http_error", "Frame upload returned HTTP ${response.code}")
                }
            }
            event["state"] = "uploaded"
            uploaded.incrementAndGet()
        } catch (failure: UploadFailure) {
            fail(event, failure.code, failure.message ?: "Frame upload failed")
        } catch (_: InterruptedIOException) {
            fail(event, "upload_timeout", "Frame upload timed out")
        } catch (_: IOException) {
            fail(event, "network_error", "Frame upload connection failed")
        } catch (_: Exception) {
            fail(event, "upload_failed", "Frame upload failed")
        } finally {
            synchronized(callLock) {
                if (activeCall === call) activeCall = null
            }
        }
        val completed = SystemClock.elapsedRealtimeNanos()
        event["completedAt"] = utc(System.currentTimeMillis())
        event["completedElapsedNanos"] = completed
        event["uploadMs"] = requestStarted?.let { (completed - it) / 1_000_000.0 }
        event["processingMs"] = (completed - started) / 1_000_000.0
        event["captureToUploadMs"] = if (capturedElapsedNanos in 0..completed) {
            (completed - capturedElapsedNanos) / 1_000_000.0
        } else null
        event["uploadedFrames"] = uploaded.get()
        event["droppedFrames"] = dropped.get()
        event["errorFrames"] = errors.get()
        event["uploadFps"] = uploaded.get() / ((completed - startedNanos).coerceAtLeast(1) / 1e9)
        return event
    }

    private fun fail(event: MutableMap<String, Any?>, code: String, message: String) {
        errors.incrementAndGet()
        if (clockGuard.changedByMs() != null) clockChanged.set(true)
        if (clockChanged.get()) {
            event["type"] = "cctvState"
            event["errorCode"] = "clock_changed"
            event["errorMessage"] = "Device clock changed; synchronize before restarting the camera."
        } else {
            event["errorCode"] = code
            event["errorMessage"] = message
        }
    }

    private fun requireStableClock(wall: Long? = null, elapsed: Long? = null) {
        val changed = if (wall != null && elapsed != null) clockGuard.changedByMs(wall, elapsed)
            else clockGuard.changedByMs()
        if (changed != null) {
            clockChanged.set(true)
            throw UploadFailure("clock_changed", "Device clock changed; synchronize before restarting the camera.")
        }
    }

    private fun elapsedMs(started: Long): Double =
        (SystemClock.elapsedRealtimeNanos() - started) / 1_000_000.0

    private fun utc(millis: Long): String = Instant.ofEpochMilli(millis).toString()

    private class UploadFailure(val code: String, message: String) : IOException(message)

    companion object {
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
        private val httpClient by lazy {
            OkHttpClient.Builder().callTimeout(3, TimeUnit.SECONDS)
                .connectTimeout(2, TimeUnit.SECONDS).readTimeout(2, TimeUnit.SECONDS)
                .writeTimeout(2, TimeUnit.SECONDS).retryOnConnectionFailure(false)
                .followRedirects(false).followSslRedirects(false).build()
        }

        private fun requiredString(args: Map<String, Any?>, name: String): String =
            (args[name] as? String)?.takeIf(String::isNotBlank)
                ?: throw IllegalArgumentException("$name must be a nonempty string")

        private fun requiredNumber(args: Map<String, Any?>, name: String): Double =
            (args[name] as? Number)?.toDouble()?.takeIf { it.isFinite() }
                ?: throw IllegalArgumentException("$name must be a finite number")

        private fun checkedUrl(value: String): URL {
            val uri = try {
                URI(value)
            } catch (_: Exception) {
                throw IllegalArgumentException("uploadUrl must be an absolute HTTP(S) frame endpoint")
            }
            require(uri.isAbsolute && uri.scheme.lowercase(Locale.ROOT) in setOf("http", "https") &&
                !uri.host.isNullOrBlank() && uri.userInfo == null && uri.fragment == null &&
                uri.rawPath == "/api/tracking/frame") {
                "uploadUrl must be an absolute HTTP(S) /api/tracking/frame endpoint"
            }
            return uri.toURL()
        }
    }
}
