"use client";

export const AUTH_CHANNEL = "gs-safety-session";

export function notifySessionChanged() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage("session-changed");
  channel.close();
}
