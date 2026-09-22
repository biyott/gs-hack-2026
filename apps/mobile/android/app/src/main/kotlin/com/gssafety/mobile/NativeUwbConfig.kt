package com.gssafety.mobile

import androidx.core.uwb.RangingParameters
import androidx.core.uwb.UwbComplexChannel
import androidx.core.uwb.UwbDevice

internal data class NativeUwbConfig(
    val epoch: String,
    val configId: Int,
    val sessionId: Int,
    val key: ByteArray,
    val addresses: List<String>,
    val channel: Int,
    val preambleIndex: Int,
    val updateRate: Int,
) {
    fun parameters(): RangingParameters = RangingParameters(
        uwbConfigType = configId,
        sessionId = sessionId,
        subSessionId = 0,
        sessionKeyInfo = key,
        subSessionKeyInfo = null,
        complexChannel = UwbComplexChannel(channel, preambleIndex),
        peerDevices = addresses.map(UwbDevice::createForAddress),
        updateRateType = updateRate,
    )

    companion object {
        fun parse(args: Map<String, Any?>, controller: Boolean): NativeUwbConfig {
            val epoch = args["sessionEpoch"] as? String
            require(!epoch.isNullOrBlank()) { "session_epoch_required" }
            val config = integer(args, "configId")
            require(config == 2 || config == 5) { "multicast_config_required" }
            val keyHex = args["sessionKeyHex"] as? String ?: ""
            val keyBytes = if (config == 5) 16 else 8
            require(keyHex.matches(Regex("[0-9a-fA-F]{${keyBytes * 2}}"))) { "invalid_session_key" }
            val addresses = (args["peerAddresses"] as? List<*>)?.map { item ->
                require(item is String && item.matches(Regex("(?:[0-9A-Fa-f]{2}:){1,7}[0-9A-Fa-f]{2}"))) {
                    "invalid_peer_address"
                }
                require(item.split(':').size in listOf(2, 8)) { "invalid_address_length" }
                item.uppercase()
            } ?: throw IllegalArgumentException("peer_addresses_required")
            require(addresses.size == if (controller) 2 else 1) { "invalid_peer_count" }
            require(addresses.distinct().size == addresses.size) { "duplicate_peer_address" }
            val sessionId = integer(args, "sessionId")
            require(sessionId != 0) { "session_id_required" }
            val channel = integer(args, "channel")
            val preamble = integer(args, "preambleIndex")
            require(channel in listOf(5, 9) && preamble in 9..12) { "invalid_complex_channel" }
            val updateRate = (args["updateRateType"] as? Number)?.toInt() ?: 1
            require(updateRate in 1..3) { "invalid_update_rate" }
            return NativeUwbConfig(
                epoch, config, sessionId,
                keyHex.chunked(2).map { it.toInt(16).toByte() }.toByteArray(),
                addresses, channel, preamble, updateRate,
            )
        }

        private fun integer(args: Map<String, Any?>, name: String): Int {
            val value = args[name] as? Number ?: throw IllegalArgumentException("${name}_required")
            require(value.toDouble().isFinite() && value.toDouble() == value.toInt().toDouble()) {
                "invalid_$name"
            }
            return value.toInt()
        }
    }
}
