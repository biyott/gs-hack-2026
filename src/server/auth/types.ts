import type { Session, SessionRequest, SessionRole } from "@gs-safety/contracts";
import { DeviceRoleSchema, SessionRoleSchema } from "@gs-safety/contracts";
import { z } from "zod";

export const DemoAccountSchema = z
  .object({
    id: z.string().min(1).max(80),
    role: SessionRoleSchema,
    workerId: z.string().min(1).nullable(),
    deviceRole: DeviceRoleSchema.nullable().default(null),
    pin: z.string().min(4).max(128),
  })
  .superRefine((account, context) => {
    let bindingAllowed: boolean;
    switch (account.role) {
      case "worker":
        bindingAllowed =
          account.workerId !== null && [null, "WORKER_1", "WORKER_2"].includes(account.deviceRole);
        break;
      case "device":
        bindingAllowed =
          account.workerId === null && ["EQUIPMENT", "CCTV"].includes(account.deviceRole ?? "");
        break;
      case "admin":
      case "operator":
      case "support":
      case "observer":
        bindingAllowed = account.workerId === null && account.deviceRole === null;
        break;
      default: {
        const exhaustiveRole: never = account.role;
        return exhaustiveRole;
      }
    }
    if (!bindingAllowed)
      context.addIssue({ code: "custom", message: "Invalid account role binding" });
  });
export type AccountRole = SessionRole;
export type { Session } from "@gs-safety/contracts";
export type DemoAccount = z.input<typeof DemoAccountSchema>;
export type LoginCredentials = SessionRequest;
export type IssuedSession = {
  readonly token: string;
  readonly session: Session;
};
export type AuthOptions = {
  readonly now?: () => number;
  readonly sessionTtlMs?: number;
};

export class AuthenticationError extends Error {
  readonly name = "AuthenticationError";

  constructor(
    readonly code:
      | "INVALID_CREDENTIALS"
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "INVALID_CONFIGURATION",
    message: string,
  ) {
    super(message);
  }
}
