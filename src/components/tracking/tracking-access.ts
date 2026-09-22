import type { SessionRole } from "@/contracts";

const consumerAccess: Readonly<Record<SessionRole, boolean>> = {
  admin: true,
  operator: true,
  support: true,
  observer: true,
  worker: false,
  device: false,
};

export function canReadTracking(role: SessionRole | null | undefined): boolean {
  return role !== null && role !== undefined && consumerAccess[role];
}
