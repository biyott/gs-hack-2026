package com.gssafety.mobile

import android.Manifest
import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.media.ImageReader
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.os.SystemClock
import android.util.Size
import android.view.Surface
import android.view.WindowManager
import io.flutter.plugin.common.MethodChannel
import io.flutter.view.TextureRegistry
import java.util.concurrent.atomic.AtomicLong

class NativeCctv(
    private val activity: Activity,
    private val textures: TextureRegistry,
    private val emit: (Map<String, Any?>) -> Unit,
) {
    private class Run(
        val generation: Long, val camera: String, val size: Size, val fps: Int,
        val producer: TextureRegistry.SurfaceProducer, val uploader: NativeFrameUploader,
        var result: MethodChannel.Result?, val rotation: Int, val timestampRealtime: Boolean,
    ) {
        var device: CameraDevice? = null
        var session: CameraCaptureSession? = null
        var reader: ImageReader? = null
        var openPending = false
        var nextFrameNanos = 0L
        var sequence = 0L
        @Volatile var timestampSource = "frame_acquired"
        val dropped = AtomicLong()
    }
    private val main = Handler(Looper.getMainLooper())
    private val thread = HandlerThread("gs-cctv-camera").apply { start() }
    private val cameraHandler = Handler(thread.looper)
    private val generations = AtomicLong()
    private val manager = activity.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    @Volatile private var current: Run? = null
    @Volatile private var disposed = false
    private var foreground = activity.hasWindowFocus()
    private var openingCount = 0
    private val lifecycle: Application.ActivityLifecycleCallbacks = object : Application.ActivityLifecycleCallbacks {
        override fun onActivityResumed(value: Activity) { if (value === activity) foreground = true }
        override fun onActivityPaused(value: Activity) { if (value === activity) { foreground = false; stop() } }
        override fun onActivityDestroyed(value: Activity) { if (value === activity) dispose() }
        override fun onActivityCreated(value: Activity, state: Bundle?) = Unit
        override fun onActivityStarted(value: Activity) = Unit
        override fun onActivityStopped(value: Activity) = Unit
        override fun onActivitySaveInstanceState(value: Activity, state: Bundle) = Unit
    }
    init { activity.application.registerActivityLifecycleCallbacks(lifecycle) }

    fun start(args: Map<String, Any?>, result: MethodChannel.Result) = onMain {
        if (disposed || !foreground) { result.error("not_foreground", "Open the app before starting the camera.", null); return@onMain }
        if (Build.VERSION.SDK_INT >= 23 && activity.checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            result.error("permission_denied", "Camera permission is required.", null); return@onMain
        }
        stopActive("stopped", "restarted", "Camera restarted.")
        var uploader: NativeFrameUploader? = null
        var producer: TextureRegistry.SurfaceProducer? = null
        try {
            val target = args["targetFps"] ?: 8
            require(target is Number && target.toDouble().isFinite() && target.toDouble() == target.toInt().toDouble() && target.toInt() in 5..10) { "targetFps must be an integer from 5 to 10." }
            val fps = target.toInt()
            val id = manager.cameraIdList.firstOrNull {
                manager.getCameraCharacteristics(it)[CameraCharacteristics.LENS_FACING] == CameraCharacteristics.LENS_FACING_BACK
            } ?: throw IllegalStateException("No rear camera is available.")
            val characteristics = manager.getCameraCharacteristics(id)
            val streams = requireNotNull(characteristics[CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP])
            val previewSizes = streams.getOutputSizes(SurfaceTexture::class.java)?.toSet().orEmpty()
            val size = streams.getOutputSizes(ImageFormat.YUV_420_888)?.filter {
                it in previewSizes && it.width % 2 == 0 && it.height % 2 == 0 && it.width <= 1920 && it.height <= 1080
            }?.minByOrNull { kotlin.math.abs(it.width.toLong() * it.height - 640L * 480) }
                ?: throw IllegalStateException("No compatible rear camera preview is available.")
            lateinit var run: Run
            uploader = NativeFrameUploader(args) { event ->
                if (event["errorCode"] == "clock_changed") {
                    fail(run, "clock_changed", "Device clock changed; synchronize before restarting the camera.")
                } else emitUi(run, event + mapOf("droppedFrames" to run.dropped.get(), "captureTimestampSource" to run.timestampSource))
            }
            producer = textures.createSurfaceProducer().apply { setSize(size.width, size.height) }
            val sensor = characteristics[CameraCharacteristics.SENSOR_ORIENTATION] ?: 0
            @Suppress("DEPRECATION") val display = activity.windowManager.defaultDisplay.rotation
            val degrees = when (display) { Surface.ROTATION_90 -> 90; Surface.ROTATION_180 -> 180; Surface.ROTATION_270 -> 270; else -> 0 }
            val rotation = if (producer.handlesCropAndRotation()) 0 else (sensor + degrees) % 360
            val realtime = characteristics[CameraCharacteristics.SENSOR_INFO_TIMESTAMP_SOURCE] == CameraCharacteristics.SENSOR_INFO_TIMESTAMP_SOURCE_REALTIME
            run = Run(generations.incrementAndGet(), id, size, fps, producer, uploader, result, rotation, realtime)
            current = run
            producer.setCallback(object : TextureRegistry.SurfaceProducer.Callback {
                override fun onSurfaceAvailable() = Unit
                override fun onSurfaceCleanup() { fail(run, "surface_lost", "Camera preview surface was released.") }
            })
            activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            emitUi(run, mapOf("type" to "cctvState", "state" to "starting", "targetFps" to fps))
            cameraHandler.post { open(run) }
        } catch (error: Exception) {
            val code = if (error is IllegalArgumentException) "invalid_arguments" else "camera_unavailable"
            if (current != null) stopActive("error", code, error.message ?: "Cannot start the camera.")
            else { uploader?.close(); producer?.release(); result.error(code, error.message, null) }
        }
    }

    private fun active(run: Run) = current === run && generations.get() == run.generation && !disposed
    private fun open(run: Run) {
        if (!active(run)) return
        if (Build.VERSION.SDK_INT >= 23 && activity.checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            fail(run, "permission_denied", "Camera permission is required."); return
        }
        try {
            run.reader = ImageReader.newInstance(run.size.width, run.size.height, ImageFormat.YUV_420_888, 2).apply {
                setOnImageAvailableListener({ reader -> readFrame(run, reader) }, cameraHandler)
            }
            run.openPending = true; openingCount++
            manager.openCamera(run.camera, object : CameraDevice.StateCallback() {
                override fun onOpened(device: CameraDevice) {
                    if (active(run)) { run.device = device; configure(run, device) } else device.close()
                    opened(run)
                }
                override fun onDisconnected(device: CameraDevice) { device.close(); opened(run); fail(run, "camera_disconnected", "Camera disconnected.") }
                override fun onError(device: CameraDevice, error: Int) { device.close(); opened(run); fail(run, "camera_error", "Camera error $error.") }
            }, cameraHandler)
        } catch (error: Exception) { opened(run); fail(run, "camera_unavailable", error.message ?: "Cannot open the camera.") }
    }

    @Suppress("DEPRECATION")
    private fun configure(run: Run, device: CameraDevice) {
        try {
            val preview = run.producer.surface
            val output = requireNotNull(run.reader).surface
            device.createCaptureSession(listOf(preview, output), object : CameraCaptureSession.StateCallback() {
                override fun onConfigured(session: CameraCaptureSession) {
                    if (!active(run)) { session.close(); return }
                    run.session = session
                    try {
                        val request = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW).apply { addTarget(preview); addTarget(output) }.build()
                        session.setRepeatingRequest(request, object : CameraCaptureSession.CaptureCallback() {
                            override fun onCaptureFailed(session: CameraCaptureSession, request: CaptureRequest, failure: CaptureFailure) {
                                fail(run, "capture_failed", "Camera capture failed (${failure.reason}).")
                            }
                        }, cameraHandler)
                        onMain {
                            if (!active(run)) return@onMain
                            run.result?.success(mapOf("textureId" to run.producer.id(), "width" to run.size.width, "height" to run.size.height, "rotationDegrees" to run.rotation))
                            run.result = null
                            emitUi(run, mapOf("type" to "cctvState", "state" to "streaming", "targetFps" to run.fps))
                        }
                    } catch (error: Exception) { fail(run, "capture_failed", error.message ?: "Cannot start capture.") }
                }
                override fun onConfigureFailed(session: CameraCaptureSession) { session.close(); fail(run, "configuration_failed", "Camera preview configuration failed.") }
            }, cameraHandler)
        } catch (error: Exception) { fail(run, "configuration_failed", error.message ?: "Cannot configure the camera.") }
    }

    private fun readFrame(run: Run, reader: ImageReader) {
        try {
            val image = reader.acquireLatestImage() ?: return
            image.use {
                if (!active(run)) return
                val reading = NativeClockGuard.sample(System::currentTimeMillis, SystemClock::elapsedRealtimeNanos)
                val now = reading.elapsedNanos
                val wallNow = reading.wallMillis
                if (now < run.nextFrameNanos) return
                val period = 1_000_000_000L / run.fps
                run.nextFrameNanos = if (run.nextFrameNanos == 0L || now - run.nextFrameNanos >= period) now + period else run.nextFrameNanos + period
                if (run.uploader.isBusy()) { run.dropped.incrementAndGet(); return }
                require(image.cropRect == Rect(0, 0, image.width, image.height)) { "Cropped camera frames are unsupported." }
                val planes = image.planes.map { NativeYuv.Plane(it.buffer, it.rowStride, it.pixelStride) }
                val bytes = NativeYuv.toNv21(image.width, image.height, planes[0], planes[1], planes[2])
                val captured = image.timestamp.takeIf { run.timestampRealtime && it in 1..now } ?: now
                run.timestampSource = if (captured == now) "frame_acquired" else "sensor_realtime"
                val wallTime = wallNow - (now - captured) / 1_000_000L
                if (!run.uploader.submit(bytes, image.width, image.height, wallTime, captured, run.sequence++)) run.dropped.incrementAndGet()
            }
        } catch (error: Exception) { fail(run, "frame_failed", error.message ?: "Cannot process camera frames.") }
    }

    fun stop() = onMain { stopActive("stopped", "stopped", "Camera stopped.") }
    private fun fail(run: Run, code: String, message: String) = onMain {
        if (active(run)) stopActive("error", code, message)
    }
    private fun stopActive(state: String, code: String, message: String) {
        val run = current ?: return
        current = null; generations.incrementAndGet()
        run.result?.error(code, message, null); run.result = null
        run.uploader.close()
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        emit(mapOf("type" to "cctvState", "state" to state) +
            if (state == "error") mapOf("errorCode" to code, "errorMessage" to message) else mapOf("reason" to code))
        cameraHandler.post {
            run.session?.close(); run.device?.close(); run.reader?.close()
            main.post { run.producer.setCallback(null); run.producer.release() }
            if (disposed && openingCount == 0) thread.quitSafely()
        }
    }
    private fun opened(run: Run) {
        if (run.openPending) { run.openPending = false; openingCount-- }
        if (disposed && openingCount == 0) thread.quitSafely()
    }
    fun dispose() = onMain {
        if (disposed) return@onMain
        stopActive("stopped", "disposed", "Camera released.")
        disposed = true
        activity.application.unregisterActivityLifecycleCallbacks(lifecycle)
        cameraHandler.post { if (openingCount == 0) thread.quitSafely() }
    }
    private fun emitUi(run: Run, event: Map<String, Any?>) = onMain { if (active(run)) emit(event) }
    private fun onMain(action: () -> Unit) { if (Looper.myLooper() == Looper.getMainLooper()) action() else main.post(action) }
}
