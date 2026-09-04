import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogMeta = Record<string, unknown>;

type SerializedError = {
  name?: string;
  message: string;
  stack?: string;
};

function serializeError(err: unknown): SerializedError | undefined {
  if (!err) return undefined;
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return { message: typeof err === "string" ? err : JSON.stringify(err) };
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "Could not stringify log entry" });
  }
}

function writeLine(level: LogLevel, line: string) {
  const stream = level === "error" || level === "warn" ? process.stderr : process.stdout;
  stream.write(line + "\n");
}

function formatDev(entry: Record<string, unknown>) {
  const { ts, level, msg, ...rest } = entry;
  const base = `${ts} ${String(level).toUpperCase()} ${String(msg)}`;
  const hasMeta = Object.keys(rest).length > 0;
  return hasMeta ? `${base} ${safeStringify(rest)}` : base;
}

function emit(level: LogLevel, msg: string, meta?: LogMeta, err?: unknown) {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  };
  const serialized = serializeError(err);
  if (serialized) entry.err = serialized;

  const isProd = process.env.NODE_ENV === "production";
  writeLine(level, isProd ? safeStringify(entry) : formatDev(entry));
}

export const logger = {
  debug(msg: string, meta?: LogMeta) {
    emit("debug", msg, meta);
  },
  info(msg: string, meta?: LogMeta) {
    emit("info", msg, meta);
  },
  warn(msg: string, meta?: LogMeta, err?: unknown) {
    emit("warn", msg, meta, err);
  },
  error(msg: string, meta?: LogMeta, err?: unknown) {
    emit("error", msg, meta, err);
  },
};

