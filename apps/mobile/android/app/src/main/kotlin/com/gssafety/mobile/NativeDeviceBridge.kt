package com.gssafety.mobile

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.view.TextureRegistry

internal class NativeDeviceBridge(
    private val activity: Activity,
    messenger: BinaryMessenger,
    textures: TextureRegistry,
) : MethodChannel.MethodCallHandler, EventChannel.StreamHandler {
    private val commands = MethodChannel(messenger, "gs_safety/native_device")
    private val events = EventChannel(messenger, "gs_safety/native_events")
    private val handler = Handler(Looper.getMainLooper())
    private var sink: EventChannel.EventSink? = null
    private var foreground = true
    private var permissionResult: MethodChannel.Result? = null
    private var tone: ToneGenerator? = null
    private var beepResult: MethodChannel.Result? = null
    private val uwb = NativeUwbSession(activity, ::emit)
    private val camera = NativeCctv(activity, textures, ::emit)

    init {
        commands.setMethodCallHandler(this)
        events.setStreamHandler(this)
    }

    override fun onListen(arguments: Any?, events: EventChannel.EventSink) {
        sink = events
        emit(mapOf("type" to "capabilities", "capabilities" to capabilities()))
    }

    override fun onCancel(arguments: Any?) { sink = null }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        try {
            val args = arguments(call.arguments)
            when (call.method) {
                "capabilities" -> result.success(capabilities())
                "requestPermissions" -> requestPermissions(args["role"] as? String, result)
                "setScreenOn" -> {
                    val enabled = args["enabled"] as? Boolean ?: false
                    screenOn(enabled)
                    result.success(null)
                }
                "prepareUwb" -> ifForeground(result) { uwb.prepare(args["role"] as? String ?: "", result) }
                "startUwb" -> ifForeground(result) { uwb.start(args, result) }
                "stopUwb" -> { uwb.stop(); result.success(null) }
                "playWarningBeep" -> ifForeground(result) { startBeep((args["durationMs"] as? Number)?.toInt() ?: 160, result) }
                "stopWarningBeep" -> { stopBeep(); result.success(null) }
                "startCctv" -> ifForeground(result) { camera.start(args, result) }
                "stopCctv" -> { camera.stop(); result.success(null) }
                "dispose" -> { stop(); result.success(null) }
                else -> result.notImplemented()
            }
        } catch (error: SecurityException) {
            result.error("permission_denied", "Android permission was denied or revoked", null)
        } catch (error: IllegalArgumentException) {
            result.error("invalid_arguments", error.message, null)
        } catch (error: IllegalStateException) {
            result.error("native_unavailable", error.javaClass.simpleName, null)
        }
    }

    private fun requestPermissions(role: String?, result: MethodChannel.Result) {
        if (permissionResult != null) {
            result.error("permission_request_pending", "A permission request is already open", null)
            return
        }
        val required = when (role) {
            "CCTV" -> listOf(Manifest.permission.CAMERA)
            "EQUIPMENT", "WORKER_1", "WORKER_2" -> if (Build.VERSION.SDK_INT >= 31) listOf(Manifest.permission.UWB_RANGING) else emptyList()
            else -> { result.error("invalid_role", "Choose a device role", null); return }
        }
        val missing = required.filter { !granted(it) }
        if (missing.isEmpty()) {
            result.success(capabilities())
            return
        }
        permissionResult = result
        ActivityCompat.requestPermissions(activity, missing.toTypedArray(), PERMISSION_REQUEST)
    }

    fun permissionResult(requestCode: Int): Boolean {
        if (requestCode != PERMISSION_REQUEST) return false
        permissionResult?.success(capabilities())
        permissionResult = null
        emit(mapOf("type" to "capabilities", "capabilities" to capabilities()))
        return true
    }

    private fun capabilities(): Map<String, Any?> {
        val cameraManager = activity.getSystemService(CameraManager::class.java)
        val rearAvailable = try {
            cameraManager.cameraIdList.any {
                cameraManager.getCameraCharacteristics(it)[CameraCharacteristics.LENS_FACING] == CameraCharacteristics.LENS_FACING_BACK
            }
        } catch (error: Exception) { false }
        return mapOf(
            "platform" to "android", "manufacturer" to Build.MANUFACTURER,
            "model" to Build.MODEL, "androidVersion" to Build.VERSION.RELEASE,
            "androidApi" to Build.VERSION.SDK_INT, "foreground" to foreground,
            "uwbHardware" to (Build.VERSION.SDK_INT >= 31 && activity.packageManager.hasSystemFeature("android.hardware.uwb")),
            "uwbPermissionGranted" to (Build.VERSION.SDK_INT >= 31 && granted(Manifest.permission.UWB_RANGING)),
            "cameraAvailable" to rearAvailable, "cameraPermissionGranted" to granted(Manifest.permission.CAMERA),
            "cameraPermissionRationale" to ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.CAMERA),
            "uwbPermissionRationale" to (Build.VERSION.SDK_INT >= 31 && ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.UWB_RANGING)),
        )
    }

    private fun beep(duration: Int): Boolean {
        require(duration in 35..1000) { "Beep duration must be 35 to 1000 milliseconds" }
        return try {
            val generator = tone ?: ToneGenerator(AudioManager.STREAM_MUSIC, 80).also { tone = it }
            generator.startTone(ToneGenerator.TONE_PROP_BEEP2, duration).also {
                emit(mapOf("type" to "audioState", "state" to if (it) "beep_started" else "beep_failed"))
            }
        } catch (error: RuntimeException) {
            emit(mapOf("type" to "audioState", "state" to "beep_failed", "error" to error.javaClass.simpleName))
            false
        }
    }

    private fun startBeep(duration: Int, result: MethodChannel.Result) {
        stopBeep()
        if (!beep(duration)) { result.success(false); return }
        beepResult = result
        handler.postDelayed({
            if (beepResult === result) {
                beepResult = null
                result.success(true)
            }
        }, duration.toLong())
    }

    private fun stopBeep() {
        tone?.stopTone()
        beepResult?.success(false)
        beepResult = null
    }

    fun onPause() {
        foreground = false
        stop()
        emit(mapOf("type" to "lifecycle", "state" to "suspended"))
    }

    fun onResume() {
        foreground = true
        emit(mapOf("type" to "lifecycle", "state" to "foreground", "requiresFreshSession" to true))
    }

    private fun stop() {
        uwb.stop("suspended")
        camera.stop()
        stopBeep()
        screenOn(false)
    }

    fun detach() {
        stop()
        camera.dispose()
        uwb.dispose()
        tone?.release()
        tone = null
        permissionResult?.error("activity_detached", "Activity was detached", null)
        permissionResult = null
        commands.setMethodCallHandler(null)
        events.setStreamHandler(null)
        sink = null
    }

    private fun screenOn(enabled: Boolean) {
        if (enabled && foreground) activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun ifForeground(result: MethodChannel.Result, start: () -> Unit) {
        if (foreground) start() else result.error("foreground_required", "Keep this role app visible and unlocked", null)
    }

    private fun emit(event: Map<String, Any?>) {
        if (Looper.myLooper() == Looper.getMainLooper()) sink?.success(event)
        else handler.post { sink?.success(event) }
    }

    private fun granted(permission: String) = ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED

    private fun arguments(value: Any?): Map<String, Any?> {
        if (value == null) return emptyMap()
        require(value is Map<*, *>) { "Arguments must be a map" }
        return value.entries.associate { entry ->
            val key = entry.key
            require(key is String) { "Argument keys must be strings" }
            key to entry.value
        }
    }

    companion object { const val PERMISSION_REQUEST = 4918 }
}
