package com.gssafety.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NativeClockGuardTest {
    @Test
    fun elapsedTimeWithoutWallClockDriftRemainsValid() {
        val clock = Clock()
        val guard = clock.guard()
        assertNull(guard.changedByMs())
        clock.advance(3_600_000)
        assertNull(guard.changedByMs())
    }

    @Test
    fun detectsForwardJumpBeforeFirstCheck() {
        val clock = Clock()
        val guard = clock.guard()
        clock.advance(100, 51)
        assertDrift(51.0, guard)
    }

    @Test
    fun detectsBackwardJumpBeforeFirstCheck() {
        val clock = Clock()
        val guard = clock.guard()
        clock.advance(100, -51)
        assertDrift(-51.0, guard)
    }

    @Test
    fun acceptsExactlyPositiveFiftyMilliseconds() {
        val clock = Clock()
        val guard = clock.guard()
        clock.advance(100, 50)
        assertNull(guard.changedByMs())
        clock.advance(100)
        assertNull(guard.changedByMs())
    }

    @Test
    fun acceptsExactlyNegativeFiftyMilliseconds() {
        val clock = Clock()
        val guard = clock.guard()
        clock.advance(100, -50)
        assertNull(guard.changedByMs())
        clock.advance(100)
        assertNull(guard.changedByMs())
    }

    @Test
    fun accumulatesDriftAgainstTheConstructionBaseline() {
        val clock = Clock()
        val guard = clock.guard()
        clock.advance(100, 30)
        assertNull(guard.changedByMs())
        clock.advance(100, 21)
        assertDrift(51.0, guard)
    }

    @Test
    fun preservesSubmillisecondMonotonicPrecisionAtTheThreshold() {
        val clock = Clock()
        val guard = clock.guard()
        clock.wall += 100
        clock.elapsed += 150_000_001
        assertDrift(-50.000001, guard)
    }

    @Test
    fun latchesTheFirstJumpEvenAfterTheWallClockReturns() {
        for (jump in listOf(-51L, 51L)) {
            val clock = Clock()
            val guard = clock.guard()
            clock.advance(100, jump)
            assertDrift(jump.toDouble(), guard)
            clock.advance(100, -jump)
            assertDrift(jump.toDouble(), guard)
            clock.advance(100, -2 * jump)
            assertDrift(jump.toDouble(), guard)
        }
    }

    @Test
    fun freshGuardAfterRecalibrationUsesTheNewBaseline() {
        val clock = Clock()
        val original = clock.guard()
        clock.advance(100, 51)
        assertDrift(51.0, original)
        val recalibrated = clock.guard()
        clock.advance(100)
        assertDrift(51.0, original)
        assertNull(recalibrated.changedByMs())
    }

    @Test
    fun detectsAnInvalidCapturePairEvenIfWallClockRecoveredBeforeSend() {
        val clock = Clock()
        val guard = clock.guard()
        val capturedWall = clock.wall + 151
        val capturedElapsed = clock.elapsed + 100_000_000
        clock.advance(200)
        assertNull(guard.changedByMs())
        assertEquals(51.0, requireNotNull(guard.changedByMs(capturedWall, capturedElapsed)), 0.0000001)
        assertDrift(51.0, guard)
    }

    @Test
    fun exposesSignedCaptureResidualWithoutMovingTheBaseline() {
        val clock = Clock()
        val guard = clock.guard()
        clock.advance(100)
        assertEquals(20.0, guard.residualMs(clock.wall + 20, clock.elapsed), 0.0000001)
        assertEquals(-20.0, guard.residualMs(clock.wall - 20, clock.elapsed), 0.0000001)
        assertEquals(0.0, guard.residualMs(clock.wall, clock.elapsed), 0.0000001)
        assertNull(guard.changedByMs())
    }

    @Test
    fun combinesStartupResidualWithLaterDriftBeforeApplyingThreshold() {
        val clock = Clock()
        val guard = clock.guard(initialResidualMs = 20.0)
        clock.advance(100, 40)
        assertEquals(60.0, guard.residualMs(clock.wall, clock.elapsed), 0.0000001)
        assertDrift(60.0, guard)
    }

    @Test
    fun oppositeDriftReducesTheSignedStartupResidual() {
        val clock = Clock()
        val guard = clock.guard(initialResidualMs = 30.0)
        clock.advance(100, -20)
        assertEquals(10.0, guard.residualMs(clock.wall, clock.elapsed), 0.0000001)
        assertNull(guard.changedByMs())
    }

    @Test
    fun schedulingDelayDuringClockReadsDoesNotBecomeAClockJump() {
        for (delay in listOf(60L, 120L)) {
            for (delayAtConstruction in listOf(false, true)) {
                val clock = Clock()
                var delayedReadPending = delayAtConstruction
                val guard = NativeClockGuard({
                    if (delayedReadPending) {
                        clock.advance(delay)
                        delayedReadPending = false
                    }
                    clock.wall
                }, { clock.elapsed })
                delayedReadPending = !delayAtConstruction
                assertNull(guard.changedByMs())
                assertEquals(0.0, guard.residualMs(clock.wall, clock.elapsed), 0.0000001)
            }
        }
    }

    private fun assertDrift(expected: Double, guard: NativeClockGuard) {
        assertEquals(expected, requireNotNull(guard.changedByMs()) { "Expected drift $expected ms" }, 0.0000001)
    }

    private class Clock {
        var wall = 1_779_000_000_000L
        var elapsed = 9_000_000_000L
        fun guard(initialResidualMs: Double = 0.0) = NativeClockGuard({ wall }, { elapsed }, initialResidualMs)
        fun advance(milliseconds: Long, jump: Long = 0) {
            wall += milliseconds + jump
            elapsed += milliseconds * 1_000_000
        }
    }
}
