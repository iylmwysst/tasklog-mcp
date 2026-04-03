export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
  debugEnabled?: boolean;
}

export interface LogFields {
  [key: string]: unknown;
}

export interface Logger {
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
  child(bindings: LogFields): Logger;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const debugEnabled = options.debugEnabled ?? isTruthy(process.env.LOGBOOK_DEBUG);
  return createBoundLogger({}, debugEnabled);
}

export function serializeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function createBoundLogger(bindings: LogFields, debugEnabled: boolean): Logger {
  const write = (level: LogLevel, event: string, fields?: LogFields) => {
    if (level === "debug" && !debugEnabled) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      event,
      pid: process.pid,
      ...bindings,
      ...fields,
    };

    console.error(JSON.stringify(payload));
  };

  return {
    debug: (event, fields) => write("debug", event, fields),
    info: (event, fields) => write("info", event, fields),
    warn: (event, fields) => write("warn", event, fields),
    error: (event, fields) => write("error", event, fields),
    child: (childBindings) => createBoundLogger({ ...bindings, ...childBindings }, debugEnabled),
  };
}

function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
