import { EventEmitter } from "node:events";
import type { AuditEntry, ServiceId } from "../types.js";

class AuditLogger extends EventEmitter {
  private entries: AuditEntry[] = [];

  log(entry: AuditEntry): void {
    this.entries.push(entry);
    this.emit("entry", entry);

    const status = entry.success ? "OK" : "FAIL";
    const dur = `${entry.durationMs}ms`;
    const err = entry.error ? ` error=${entry.error}` : "";
    process.stderr.write(
      `[audit] ${entry.timestamp} ${status} ${entry.tool} (${entry.service}) ${dur}${err}\n`
    );
  }

  /** Wrap a tool execution with audit logging */
  async wrap<T>(
    tool: string,
    service: ServiceId,
    args: Record<string, unknown>,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.log({
        timestamp: new Date().toISOString(),
        tool,
        service,
        args,
        success: true,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (err: any) {
      this.log({
        timestamp: new Date().toISOString(),
        tool,
        service,
        args,
        success: false,
        durationMs: Date.now() - start,
        error: err.message ?? String(err),
      });
      throw err;
    }
  }

  getEntries(): AuditEntry[] {
    return [...this.entries];
  }
}

export const audit = new AuditLogger();
