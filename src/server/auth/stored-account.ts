import { DeviceRoleSchema, SessionRoleSchema } from "@gs-safety/contracts";
import { z } from "zod";

export const StoredAccountSchema = z
  .object({
    id: z.string(),
    role: SessionRoleSchema,
    worker_id: z.string().nullable(),
    device_role: DeviceRoleSchema.nullable(),
    pin_hash: z.string(),
    enabled: z.union([z.literal(0), z.literal(1)]),
    auth_version: z.number().int().positive(),
  })
  .readonly();

export const StoredSessionSchema = StoredAccountSchema.unwrap()
  .extend({
    session_id: z.string(),
    expires_at: z.number().int(),
  })
  .readonly();
