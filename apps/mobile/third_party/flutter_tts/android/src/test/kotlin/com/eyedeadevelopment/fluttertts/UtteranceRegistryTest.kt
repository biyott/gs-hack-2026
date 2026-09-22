package com.eyedeadevelopment.fluttertts

import org.junit.Assert.*
import org.junit.Test

class UtteranceRegistryTest {
    @Test fun stale_done_cannot_consume_new_utterance_result() {
        // Given an old utterance cancelled before a new result is registered.
        val registry = UtteranceRegistry<String>()
        registry.register("old", "old-result")
        registry.clear()
        registry.register("new", "new-result")
        // When the old Android onDone callback arrives.
        val completed = registry.complete("old")
        // Then the new result is neither consumed nor completed.
        assertNull(completed)
        assertEquals("new-result", registry.complete("new"))
    }

    @Test fun callback_queued_before_stop_is_rejected_when_handler_runs() {
        // Given onDone queued by the TTS engine before stop plus a new speak.
        val registry = UtteranceRegistry<String>()
        val queue = mutableListOf<() -> Unit>()
        var completed: String? = null
        registry.register("old", "old-result")
        registry.dispatch("old", queue::add) { completed = registry.complete("old") }
        registry.clear()
        registry.register("new", "new-result")
        // When the delayed main Handler finally runs the callback.
        queue.single().invoke()
        // Then no shared state or the newest result can be touched.
        assertNull(completed)
        assertEquals("new-result", registry.complete("new"))
    }

    @Test fun stale_start_stop_error_progress_callbacks_cannot_mutate_state() {
        // Given all callback kinds queued for a superseded utterance.
        val registry = UtteranceRegistry<String>()
        val queue = mutableListOf<() -> Unit>()
        val events = mutableListOf<String>()
        registry.register("old", null)
        listOf("start", "stop", "error", "progress").forEach { event ->
            registry.dispatch("old", queue::add) { events.add(event) }
        }
        registry.clear()
        registry.register("new", null)
        // When previously queued callbacks execute.
        queue.forEach { it() }
        // Then none is delivered as a lifecycle event for the new speech.
        assertTrue(events.isEmpty())
    }

    @Test fun queued_utterances_keep_independent_completion_ownership() {
        // Given two valid QUEUE_ADD utterances.
        val registry = UtteranceRegistry<String>()
        registry.register("first", "first-result")
        registry.register("second", "second-result")
        // When the first finishes while the second remains queued.
        val completed = registry.complete("first")
        // Then each result belongs to its own utterance, not the latest one.
        assertEquals("first-result", completed)
        assertEquals("second-result", registry.complete("second"))
    }

    @Test fun cancellation_returns_pending_results_once_and_invalidates_all_ids() {
        // Given one awaited and one non-awaited utterance.
        val registry = UtteranceRegistry<String>()
        registry.register("awaited", "result")
        registry.register("queued", null)
        // When stop invalidates the registry.
        val cancelled = registry.clear()
        // Then only the awaited result is completed and duplicate stop is empty.
        assertEquals(listOf("result"), cancelled)
        assertFalse(registry.hasUtterances())
        assertTrue(registry.clear().isEmpty())
    }

    @Test fun valid_callback_can_complete_only_once() {
        // Given one valid result and duplicate engine completion callbacks.
        val registry = UtteranceRegistry<String>()
        val queue = mutableListOf<() -> Unit>()
        val completed = mutableListOf<String?>()
        registry.register("current", "result")
        repeat(2) { registry.dispatch("current", queue::add) { completed.add(registry.complete("current")) } }
        // When the Handler processes both callbacks.
        queue.forEach { it() }
        // Then exactly one completion escapes the native boundary.
        assertEquals(listOf("result"), completed)
    }
}
