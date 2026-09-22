package com.gssafety.mobile

import java.nio.ByteBuffer
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class NativeYuvTest {
    @Test
    fun contiguousPlanesProduceLumaFollowedByVu() {
        val result = NativeYuv.toNv21(
            4, 2,
            plane(byteArrayOf(1, 2, 3, 4, 5, 6, 7, 8), 4),
            plane(byteArrayOf(11, 12), 2),
            plane(byteArrayOf(21, 22), 2),
        )

        assertArrayEquals(byteArrayOf(1, 2, 3, 4, 5, 6, 7, 8, 21, 11, 22, 12), result)
    }

    @Test
    fun skipsPaddedRowsWithoutReadingMissingFinalPadding() {
        val result = NativeYuv.toNv21(
            4, 4,
            plane(byteArrayOf(1, 2, 3, 4, 99, 99, 5, 6, 7, 8, 99, 99,
                9, 10, 11, 12, 99, 99, 13, 14, 15, 16), 6),
            plane(byteArrayOf(31, 32, 99, 33, 34), 3),
            plane(byteArrayOf(41, 42, 99, 43, 44), 3),
        )

        assertArrayEquals(byteArrayOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
            13, 14, 15, 16, 41, 31, 42, 32, 43, 33, 44, 34), result)
    }

    @Test
    fun readsInterleavedChromaViewsAndPreservesPositionsAndLimits() {
        val chroma = ByteBuffer.wrap(byteArrayOf(99, 21, 11, 22, 12, 99, 99, 23, 13, 24, 14, 99))
        val v = chroma.duplicate().apply { position(1); limit(10) }
        val u = chroma.duplicate().apply { position(2); limit(11) }.asReadOnlyBuffer()
        val y = ByteBuffer.wrap(byteArrayOf(99, 1, 2, 3, 4, 5, 6, 7, 8,
            9, 10, 11, 12, 13, 14, 15, 16, 99)).apply { position(1); limit(17) }

        val result = NativeYuv.toNv21(4, 4,
            NativeYuv.Plane(y, 4, 1), NativeYuv.Plane(u, 6, 2), NativeYuv.Plane(v, 6, 2))

        assertArrayEquals(byteArrayOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
            13, 14, 15, 16, 21, 11, 22, 12, 23, 13, 24, 14), result)
        assertEquals(1, y.position())
        assertEquals(17, y.limit())
        assertEquals(2, u.position())
        assertEquals(11, u.limit())
        assertEquals(1, v.position())
        assertEquals(10, v.limit())
    }

    @Test
    fun supportsDirectSlicedBuffersAndLumaPixelStride() {
        val storage = ByteBuffer.allocateDirect(10)
        storage.put(byteArrayOf(99, 1, 99, 2, 99, 3, 99, 4, 99, 99))
        storage.position(1)
        storage.limit(8)

        val result = NativeYuv.toNv21(2, 2,
            NativeYuv.Plane(storage.slice(), 4, 2),
            plane(byteArrayOf(11), 1), plane(byteArrayOf(21), 1))

        assertArrayEquals(byteArrayOf(1, 2, 3, 4, 21, 11), result)
    }

    @Test
    fun rejectsNonpositiveOddOrOversizedDimensions() {
        val small = plane(byteArrayOf(1, 2, 3, 4), 2)
        for ((width, height) in listOf(0 to 2, 2 to 0, -2 to 2, 2 to -2, 3 to 2, 2 to 3)) {
            rejects("positive, even") { NativeYuv.toNv21(width, height, small, small, small) }
        }
        rejects("too large") { NativeYuv.toNv21(Int.MAX_VALUE - 1, Int.MAX_VALUE - 1, small, small, small) }
    }

    @Test
    fun rejectsNonpositiveStridesAndOverlappingRows() {
        val y = plane(byteArrayOf(1, 2, 3, 4), 2)
        val uv = plane(byteArrayOf(5), 1)
        for (invalid in listOf(y.copy(rowStride = 0), y.copy(rowStride = -1),
            y.copy(pixelStride = 0), y.copy(pixelStride = -1))) {
            rejects("strides must be positive") { NativeYuv.toNv21(2, 2, invalid, uv, uv) }
        }
        rejects("pixel span") { NativeYuv.toNv21(2, 2, y.copy(rowStride = 1), uv, uv) }
        rejects("pixel span") { NativeYuv.toNv21(2, 2, y.copy(pixelStride = Int.MAX_VALUE), uv, uv) }
    }

    @Test
    fun rejectsBuffersWhoseLimitsOrPositionsExcludeRequiredPixels() {
        val y = plane(byteArrayOf(1, 2, 3, 4), 2)
        val uv = plane(byteArrayOf(5), 1)
        val truncatedY = y.copy(buffer = y.buffer.duplicate().apply { limit(3) })
        rejects("Y plane buffer") { NativeYuv.toNv21(2, 2, truncatedY, uv, uv) }
        val offsetY = y.copy(buffer = y.buffer.duplicate().apply { position(1) })
        rejects("Y plane buffer") { NativeYuv.toNv21(2, 2, offsetY, uv, uv) }
        val empty = plane(byteArrayOf(), 1)
        rejects("U plane buffer") { NativeYuv.toNv21(2, 2, y, empty, uv) }
        rejects("V plane buffer") { NativeYuv.toNv21(2, 2, y, uv, empty) }
        rejects("Y plane buffer") { NativeYuv.toNv21(2, 2, y.copy(rowStride = Int.MAX_VALUE), uv, uv) }
    }

    private fun plane(bytes: ByteArray, rowStride: Int, pixelStride: Int = 1) =
        NativeYuv.Plane(ByteBuffer.wrap(bytes), rowStride, pixelStride)

    private fun rejects(messagePart: String, action: () -> Unit) {
        try {
            action()
            fail("Expected IllegalArgumentException containing '$messagePart'")
        } catch (exception: IllegalArgumentException) {
            assertTrue(exception.message.orEmpty(), exception.message.orEmpty().contains(messagePart))
        }
    }
}
