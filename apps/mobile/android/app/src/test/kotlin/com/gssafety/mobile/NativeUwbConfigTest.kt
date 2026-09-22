package com.gssafety.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class NativeUwbConfigTest {
    private fun valid(): Map<String, Any?> = mapOf(
        "sessionEpoch" to "epoch-1", "sessionId" to 4135, "configId" to 5,
        "sessionKeyHex" to "0123456789abcdef0123456789abcdef",
        "peerAddresses" to listOf("AA:01", "AA:02"),
        "channel" to 9, "preambleIndex" to 10, "updateRateType" to 1,
    )

    @Test fun controller_preserves_two_distinct_peers() {
        // Given a provisioned multicast epoch containing two workers.
        val input = valid()
        // When the Controller configuration is parsed.
        val config = NativeUwbConfig.parse(input, controller = true)
        // Then both peers and the same key/session remain available.
        assertEquals(listOf("AA:01", "AA:02"), config.addresses)
        assertEquals(16, config.key.size)
        assertEquals(4135, config.sessionId)
    }

    @Test fun controller_rejects_single_peer() {
        // Given one worker instead of the required pair.
        val input = valid() + ("peerAddresses" to listOf("AA:01"))
        // When parsing a Controller, then reject incomplete readiness.
        assertThrows(IllegalArgumentException::class.java) { NativeUwbConfig.parse(input, true) }
    }

    @Test fun controlee_requires_exactly_one_controller() {
        // Given a Controlee with both worker addresses incorrectly supplied.
        val input = valid()
        // When parsing a Controlee, then reject the incorrect peer topology.
        assertThrows(IllegalArgumentException::class.java) { NativeUwbConfig.parse(input, false) }
    }

    @Test fun provisioned_config_rejects_static_key_length() {
        // Given a static eight-byte key with provisioned STS.
        val input = valid() + ("sessionKeyHex" to "0123456789abcdef")
        // When validating, then reject incompatible cryptographic parameters.
        assertThrows(IllegalArgumentException::class.java) { NativeUwbConfig.parse(input, true) }
    }

    @Test fun controller_rejects_duplicate_peer_addresses_case_insensitively() {
        // Given the same radio address with different text casing.
        val input = valid() + ("peerAddresses" to listOf("aa:01", "AA:01"))
        // When validating, then one peer cannot pretend to be two workers.
        assertThrows(IllegalArgumentException::class.java) { NativeUwbConfig.parse(input, true) }
    }

    @Test fun unicast_is_rejected_for_two_worker_demo() {
        // Given a unicast config substituted for the agreed multicast session.
        val input = valid() + ("configId" to 1)
        // When validating, then fail instead of silently changing the topology.
        assertThrows(IllegalArgumentException::class.java) { NativeUwbConfig.parse(input, true) }
    }

    @Test fun fractional_session_identifier_is_rejected() {
        // Given a malformed HTTP/channel boundary value.
        val input = valid() + ("sessionId" to 7.5)
        // When parsing, then reject instead of truncating to a different session.
        assertThrows(IllegalArgumentException::class.java) { NativeUwbConfig.parse(input, true) }
    }
}
