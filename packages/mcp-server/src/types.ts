import { z } from "zod";

/** Supported third-party services */
export type ServiceId = "gmail" | "github" | "calendar";

/** Auth0 connection name for each service */
export const SERVICE_CONNECTIONS: Record<ServiceId, string> = {
  gmail: "google-oauth2",
  github: "github",
  calendar: "google-oauth2",
};

/** A single MCP tool definition */
export interface ToolDef {
  name: string;
  description: string;
  service: ServiceId;
  type: "read" | "write";
  requiredScopes: string[];
  inputSchema: z.ZodType<any>;
  execute: (args: any, accessToken: string) => Promise<any>;
}

/** Token exchange response from Auth0 */
export interface TokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/** Audit log entry */
export interface AuditEntry {
  timestamp: string;
  tool: string;
  service: ServiceId;
  args: Record<string, unknown>;
  success: boolean;
  durationMs: number;
  error?: string;
}
