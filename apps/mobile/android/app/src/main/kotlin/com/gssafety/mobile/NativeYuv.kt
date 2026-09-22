package com.gssafety.mobile

import java.nio.ByteBuffer

/** Converts full-frame, even-sized YUV_420_888 planes into compact NV21 bytes. */
object NativeYuv {
    data class Plane(val buffer: ByteBuffer, val rowStride: Int, val pixelStride: Int)

    /**
     * Each buffer's position identifies its first pixel; only bytes before its limit are read.
     * Callers must supply the full frame, or prepare independently aligned cropped planes.
     * Source buffer positions and limits are preserved.
     */
    fun toNv21(width: Int, height: Int, y: Plane, u: Plane, v: Plane): ByteArray {
        require(width > 0 && height > 0 && width % 2 == 0 && height % 2 == 0) {
            "NV21 requires positive, even full-frame dimensions; align cropped planes first"
        }
        val pixelCount = width.toLong() * height
        val byteCount = pixelCount + pixelCount / 2
        require(byteCount <= Int.MAX_VALUE) { "Frame is too large for an NV21 byte array" }

        val yBuffer = checkedBuffer("Y", y, width, height)
        val uBuffer = checkedBuffer("U", u, width / 2, height / 2)
        val vBuffer = checkedBuffer("V", v, width / 2, height / 2)
        val result = ByteArray(byteCount.toInt())
        var destination = 0
        for (row in 0 until height) {
            val rowStart = yBuffer.position() + row * y.rowStride
            for (column in 0 until width) {
                result[destination++] = yBuffer.get(rowStart + column * y.pixelStride)
            }
        }
        for (row in 0 until height / 2) {
            val uStart = uBuffer.position() + row * u.rowStride
            val vStart = vBuffer.position() + row * v.rowStride
            for (column in 0 until width / 2) {
                result[destination++] = vBuffer.get(vStart + column * v.pixelStride)
                result[destination++] = uBuffer.get(uStart + column * u.pixelStride)
            }
        }
        return result
    }

    private fun checkedBuffer(name: String, plane: Plane, columns: Int, rows: Int): ByteBuffer {
        require(plane.rowStride > 0 && plane.pixelStride > 0) {
            "$name plane strides must be positive"
        }
        val rowBytes = (columns - 1).toLong() * plane.pixelStride + 1
        require(plane.rowStride.toLong() >= rowBytes) {
            "$name plane row stride is smaller than its pixel span"
        }
        val requiredBytes = (rows - 1).toLong() * plane.rowStride + rowBytes
        val buffer = plane.buffer.duplicate()
        require(requiredBytes <= buffer.remaining().toLong()) {
            "$name plane buffer does not contain all pixels between its position and limit"
        }
        return buffer
    }
}
