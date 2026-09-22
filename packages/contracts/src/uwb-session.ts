import { z } from "zod";
import { DeviceRoleSchema } from "./core";

export const UwbParticipantRoleSchema = DeviceRoleSchema.exclude(["CCTV"]);
export const UwbAddressSchema = z
  .string()
  .regex(/^(?:[0-9a-fA-F]{2}:){1}[0-9a-fA-F]{2}$|^(?:[0-9a-fA-F]{2}:){7}[0-9a-fA-F]{2}$/)
  .transform((address) => address.toUpperCase());
const ChannelSchema = z.union([z.literal(5), z.literal(9)]);
const PreambleSchema = z.number().int().min(9).max(12);
export const UwbCapabilitiesSchema = z
  .object({
    distanceSupported: z.boolean(),
    azimuthSupported: z.boolean(),
    elevationSupported: z.boolean(),
    backgroundSupported: z.boolean(),
    supportedConfigIds: z.array(z.number().int().positive()).max(32).readonly(),
    supportedChannels: z.array(z.number().int().positive()).max(32).readonly(),
    supportedUpdateRates: z.array(z.number().int().positive()).max(32).readonly(),
    supportedSlotDurations: z.array(z.number().int().positive()).max(32).readonly(),
    minRangingInterval: z.number().int().nonnegative(),
  })
  .readonly();

const PreparedFields = {
  deviceId: z.string().min(1).max(120),
  generation: z.number().int().nonnegative(),
  localAddress: UwbAddressSchema,
  capabilities: UwbCapabilitiesSchema,
};
export const UwbPreparedRegistrationSchema = z.discriminatedUnion("role", [
  z
    .object({
      ...PreparedFields,
      role: z.literal("EQUIPMENT"),
      channel: ChannelSchema,
      preambleIndex: PreambleSchema,
    })
    .readonly(),
  z
    .object({
      ...PreparedFields,
      role: z.enum(["WORKER_1", "WORKER_2"]),
      channel: z.null(),
      preambleIndex: z.null(),
    })
    .readonly(),
]);

export const UwbPairingStatusSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("waiting"),
      missingRoles: z.array(UwbParticipantRoleSchema).readonly(),
    })
    .readonly(),
  z
    .object({
      status: z.literal("unsupported"),
      reason: z.enum([
        "multicast-config",
        "distance",
        "channel",
        "update-rate",
        "duplicate-address",
        "duplicate-device",
      ]),
    })
    .readonly(),
  z.object({ status: z.literal("ready"), sessionEpoch: z.string().min(1) }).readonly(),
]);

export const UwbSessionConfigSchema = z
  .object({
    sessionEpoch: z.string().min(1),
    sessionId: z.number().int().min(1).max(2_147_483_647),
    configId: z.union([z.literal(2), z.literal(5)]),
    sessionKeyHex: z.string().regex(/^[0-9a-f]{16}(?:[0-9a-f]{16})?$/),
    peerAddresses: z.array(UwbAddressSchema).min(1).max(2).readonly(),
    channel: ChannelSchema,
    preambleIndex: PreambleSchema,
    updateRateType: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .superRefine((config, context) => {
    if (config.sessionKeyHex.length !== (config.configId === 5 ? 32 : 16))
      context.addIssue({
        code: "custom",
        path: ["sessionKeyHex"],
        message: "Key length must match the native multicast config.",
      });
    if (new Set(config.peerAddresses).size !== config.peerAddresses.length)
      context.addIssue({
        code: "custom",
        path: ["peerAddresses"],
        message: "Peer addresses must be distinct.",
      });
  })
  .readonly();

export const UwbParticipantConfigSchema = z
  .object({
    status: z.literal("ready"),
    config: UwbSessionConfigSchema,
    peerWorkers: z.record(UwbAddressSchema, z.enum(["WORKER-A", "WORKER-B"])).readonly(),
  })
  .readonly();

export type UwbParticipantRole = z.infer<typeof UwbParticipantRoleSchema>;
export type UwbPreparedRegistration = z.infer<typeof UwbPreparedRegistrationSchema>;
export type UwbPairingStatus = z.infer<typeof UwbPairingStatusSchema>;
export type UwbSessionConfig = z.infer<typeof UwbSessionConfigSchema>;
export type UwbParticipantConfig = z.infer<typeof UwbParticipantConfigSchema>;
