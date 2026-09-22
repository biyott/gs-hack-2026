import { z } from "zod";
import { PersistenceError } from "./errors";

const MetadataSchema = z.record(z.string(), z.json());
type JsonValue = z.infer<ReturnType<typeof z.json>>;

export function requireMeasurementMetadata(payloadJson: string): void {
  if (Buffer.byteLength(payloadJson, "utf8") > 65_536) {
    throw new PersistenceError("INVALID_RECORD", "Measurement metadata exceeds 64 KiB");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(payloadJson);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new PersistenceError("INVALID_RECORD", "Measurement payload must be valid JSON");
    }
    throw error;
  }
  const pending: JsonValue[] = [MetadataSchema.parse(raw)];
  while (pending.length > 0) {
    const value = pending.pop();
    if (typeof value === "string" && /^(?:data:image\/(?:jpe?g)|\/9j\/)/i.test(value)) {
      throw new PersistenceError("INVALID_RECORD", "Measurement payload contains forbidden data");
    }
    if (Array.isArray(value)) {
      pending.push(...value);
    } else if (value !== null && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) {
        const name = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (
          /sessionkey|token|authorization|cookie|password|secret|privatekey|pinhash|accesscode/.test(
            name,
          ) ||
          /^(?:jpeg|jpegbase64|jpegbytes|imagebase64|imagebytes|rawimage|pin)$/.test(name)
        ) {
          throw new PersistenceError(
            "INVALID_RECORD",
            "Measurement payload contains forbidden data",
          );
        }
        pending.push(entry);
      }
    }
  }
}
