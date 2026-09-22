export class PersistenceError extends Error {
  readonly name = "PersistenceError";

  constructor(
    readonly code: "NOT_FOUND" | "CONFLICT" | "INVALID_RECORD",
    message: string,
  ) {
    super(message);
  }
}
