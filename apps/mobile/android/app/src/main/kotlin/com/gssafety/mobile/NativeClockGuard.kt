package com.gssafety.mobile

import kotlin.math.abs

internal class NativeClockGuard(
    private val wallMillis: () -> Long,
    private val elapsedNanos: () -> Long,
    private val initialResidualMs: Double = 0.0,
) {
    init { require(initialResidualMs.isFinite()) { "Clock baseline residual must be finite" } }
    private val baseline = sample(wallMillis, elapsedNanos)
    private var discontinuityMs: Double? = null

    fun residualMs(wall: Long, elapsed: Long): Double =
        initialResidualMs + (wall - baseline.wallMillis).toDouble() -
            (elapsed - baseline.elapsedNanos) / 1_000_000.0

    fun changedByMs(): Double? = sample(wallMillis, elapsedNanos).let {
        changedByMs(it.wallMillis, it.elapsedNanos)
    }

    @Synchronized
    fun changedByMs(wall: Long, elapsed: Long): Double? {
        if (discontinuityMs == null) {
            val residual = residualMs(wall, elapsed)
            if (abs(residual) > 50.0) discontinuityMs = residual
        }
        return discontinuityMs
    }

    internal data class Reading(val wallMillis: Long, val elapsedNanos: Long, val spanNanos: Long)

    companion object {
        fun sample(wallMillis: () -> Long, elapsedNanos: () -> Long): Reading {
            var narrowest: Reading? = null
            repeat(3) {
                val before = elapsedNanos()
                val wall = wallMillis()
                val after = elapsedNanos()
                val span = after - before
                val reading = Reading(wall, before + span / 2, span)
                if (narrowest == null || span < narrowest!!.spanNanos) narrowest = reading
                if (span <= 1_000_000) return reading
            }
            return requireNotNull(narrowest)
        }
    }
}
