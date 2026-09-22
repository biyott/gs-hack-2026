package com.eyedeadevelopment.fluttertts

/** Accessed on the platform thread; callbacks check ownership after dispatch. */
internal class UtteranceRegistry<T> {
    private class Entry<T>(val result: T?)
    private val entries = LinkedHashMap<String, Entry<T>>()

    fun register(id: String, result: T?) { entries[id] = Entry(result) }
    fun contains(id: String): Boolean = entries.containsKey(id)
    fun hasUtterances(): Boolean = entries.isNotEmpty()
    fun dispatch(id: String, post: (() -> Unit) -> Unit, callback: () -> Unit) {
        post { if (contains(id)) callback() }
    }
    fun complete(id: String): T? = entries.remove(id)?.result
    fun clear(): List<T> {
        val results = entries.values.mapNotNull { it.result }
        entries.clear()
        return results
    }
}
