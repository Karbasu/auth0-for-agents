import { config } from "../config.js";
import type { ServiceId } from "../types.js";

/**
 * Return the set of scopes the user has granted for a given service.
 * In stdio mode these come from environment variables.
 */
export function getUserScopes(service: ServiceId): string[] {
  return config.scopes[service];
}

/**
 * Check whether the user has ALL of the required scopes for a service.
 */
export function hasScopes(
  service: ServiceId,
  required: string[]
): boolean {
  const granted = getUserScopes(service);
  return required.every((s) => granted.includes(s));
}
