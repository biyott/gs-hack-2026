package com.gssafety.mobile

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.uwb.RangingCapabilities
import androidx.core.uwb.RangingResult
import androidx.core.uwb.UwbAvailabilityCallback
import androidx.core.uwb.UwbClientSessionScope
import androidx.core.uwb.UwbControllerSessionScope
import androidx.core.uwb.UwbManager
import io.flutter.plugin.common.MethodChannel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

internal class NativeUwbSession(
    private val activity: Activity,
    private val emit: (Map<String, Any?>) -> Unit,
) {
    private val jobs = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var manager: UwbManager? = null
    private var prepared: UwbClientSessionScope? = null
    private var ranging: Job? = null
    private var pending: MethodChannel.Result? = null
    private var controller = false
    private var generation = 0L
    private var epoch: String? = null
    private var sequence = 0L

    fun prepare(role: String, result: MethodChannel.Result) {
        if (role !in listOf("EQUIPMENT", "WORKER_1", "WORKER_2")) {
            result.error("invalid_role", "Select an equipment or worker role", null)
            return
        }
        if (Build.VERSION.SDK_INT < 31 || !activity.packageManager.hasSystemFeature("android.hardware.uwb")) {
            result.error("uwb_unsupported", "This device has no available Android UWB hardware", null)
            return
        }
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.UWB_RANGING) != PackageManager.PERMISSION_GRANTED) {
            result.error("permission_denied", "UWB permission is required", null)
            return
        }
        stop()
        controller = role == "EQUIPMENT"
        pending = result
        val token = generation
        jobs.launch {
            try {
                val uwb = manager ?: UwbManager.createInstance(activity.applicationContext).also { manager = it }
                if (!uwb.isAvailable()) {
                    finishPrepare(token) { it.error("uwb_disabled", "Enable UWB and leave airplane mode", null) }
                    return@launch
                }
                if (token != generation) return@launch
                uwb.setUwbAvailabilityCallback(ContextCompat.getMainExecutor(activity), object : UwbAvailabilityCallback {
                    override fun onUwbStateChanged(isAvailable: Boolean, reason: Int) {
                        emit(mapOf("type" to "uwbState", "state" to if (isAvailable) "available" else "unavailable", "reason" to reason))
                        if (!isAvailable) stop("unavailable")
                    }
                })
                val scope = if (controller) uwb.controllerSessionScope() else uwb.controleeSessionScope()
                if (token != generation) return@launch
                prepared = scope
                val channel = (scope as? UwbControllerSessionScope)?.uwbComplexChannel
                finishPrepare(token) {
                    it.success(mapOf(
                        "generation" to token, "role" to role, "localAddress" to scope.localAddress.toString(),
                        "channel" to channel?.channel, "preambleIndex" to channel?.preambleIndex,
                        "capabilities" to capabilities(scope.rangingCapabilities),
                    ))
                }
                state("prepared")
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                finishPrepare(token) { it.error("uwb_prepare_failed", error.javaClass.simpleName, null) }
                if (token == generation) state("failed", error.javaClass.simpleName)
            }
        }
    }

    fun start(args: Map<String, Any?>, result: MethodChannel.Result) {
        val scope = prepared
        if (scope == null || ranging != null) {
            result.error("uwb_not_prepared", "Prepare a fresh UWB session before starting", null)
            return
        }
        val config = try {
            NativeUwbConfig.parse(args, controller).also {
                require(it.configId in scope.rangingCapabilities.supportedConfigIds) { "unsupported_config" }
                require(it.channel in scope.rangingCapabilities.supportedChannels) { "unsupported_channel" }
                require(it.updateRate in scope.rangingCapabilities.supportedRangingUpdateRates) { "unsupported_update_rate" }
                if (scope is UwbControllerSessionScope) {
                    require(it.channel == scope.uwbComplexChannel.channel && it.preambleIndex == scope.uwbComplexChannel.preambleIndex) {
                        "controller_channel_changed"
                    }
                }
            }
        } catch (error: IllegalArgumentException) {
            result.error("invalid_uwb_parameters", error.message, null)
            return
        }
        epoch = config.epoch
        sequence = 0L
        val token = generation
        state("starting")
        ranging = jobs.launch {
            var failed = false
            try {
                scope.prepareSession(config.parameters()).collect { update ->
                    if (token == generation) handle(update)
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                failed = true
                if (token == generation) state("failed", error.javaClass.simpleName)
            } finally {
                config.key.fill(0)
                if (token == generation) {
                    prepared = null
                    ranging = null
                    if (!failed) state("stopped")
                }
            }
        }
        result.success(null)
    }

    private fun handle(update: RangingResult) {
        when (update) {
            is RangingResult.RangingResultPosition -> {
                val position = update.position
                emit(mapOf(
                    "type" to "uwbMeasurement", "source" to "uwb", "sessionEpoch" to epoch,
                    "generation" to generation, "sequence" to ++sequence,
                    "peerAddress" to update.device.address.toString(), "capturedAt" to utcNow(),
                    "capturedElapsedNanos" to position.elapsedRealtimeNanos,
                    "distanceM" to position.distance?.value?.toDouble(),
                    "azimuthRad" to position.azimuth?.value?.let { Math.toRadians(it.toDouble()) },
                    "elevationRad" to position.elevation?.value?.let { Math.toRadians(it.toDouble()) },
                    "uncertaintyM" to null,
                ))
            }
            is RangingResult.RangingResultInitialized -> peerState("initialized", update.device.address.toString())
            is RangingResult.RangingResultPeerDisconnected -> peerState("disconnected", update.device.address.toString(), update.reason)
            is RangingResult.RangingResultFailure -> state("failed", "ranging_failure_${update.reason}")
        }
    }

    fun stop(reason: String = "stopped") {
        generation++
        pending?.error("uwb_cancelled", "UWB preparation was cancelled", null)
        pending = null
        ranging?.cancel()
        ranging = null
        prepared = null
        epoch = null
        manager?.clearUwbAvailabilityCallback()
        state(reason)
    }

    fun dispose() {
        stop()
        jobs.cancel()
        manager = null
    }

    private fun finishPrepare(token: Long, finish: (MethodChannel.Result) -> Unit) {
        if (token != generation) return
        pending?.let(finish)
        pending = null
    }

    private fun state(status: String, error: String? = null) = emit(mapOf(
        "type" to "uwbState", "state" to status, "generation" to generation,
        "sessionEpoch" to epoch, "error" to error,
    ))

    private fun peerState(status: String, address: String, reason: Int? = null) = emit(mapOf(
        "type" to "uwbState", "state" to status, "peerAddress" to address,
        "generation" to generation, "sessionEpoch" to epoch, "reason" to reason,
    ))

    private fun capabilities(value: RangingCapabilities): Map<String, Any?> = mapOf(
        "distanceSupported" to value.isDistanceSupported,
        "azimuthSupported" to value.isAzimuthalAngleSupported,
        "elevationSupported" to value.isElevationAngleSupported,
        "backgroundSupported" to value.isBackgroundRangingSupported,
        "supportedConfigIds" to value.supportedConfigIds.toList(),
        "supportedChannels" to value.supportedChannels.toList(),
        "supportedUpdateRates" to value.supportedRangingUpdateRates.toList(),
        "supportedSlotDurations" to value.supportedSlotDurations.toList(),
        "minRangingInterval" to value.minRangingInterval,
    )

    private fun utcNow(): String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }.format(Date())
}
