export type TimedEvent = { readonly id: string; readonly atMs: number };
export type EventBatch<T extends TimedEvent> = {
  readonly atMs: number;
  readonly events: readonly T[];
};

export function batchesBetween<T extends TimedEvent>(
  events: readonly T[],
  afterMs: number,
  throughMs: number,
): readonly EventBatch<T>[] {
  const batches = new Map<number, T[]>();
  for (const event of events) {
    if (event.atMs <= afterMs || event.atMs > throughMs) continue;
    const batch = batches.get(event.atMs);
    if (batch === undefined) batches.set(event.atMs, [event]);
    else batch.push(event);
  }
  return [...batches].map(([atMs, batchEvents]) => ({ atMs, events: batchEvents }));
}
