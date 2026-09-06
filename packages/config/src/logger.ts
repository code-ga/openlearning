export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_WEIGHTS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export class Logger {
  private level: LogLevel;
  private serviceName: string;

  constructor(serviceName: string = "openlearning", level: LogLevel = "info") {
    this.serviceName = serviceName;
    this.level = level;
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_WEIGHTS[level] >= LOG_LEVEL_WEIGHTS[this.level];
  }

  private formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      service: this.serviceName,
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { context } : {}),
    };
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(JSON.stringify(this.formatLog("debug", message, context)));
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.info(JSON.stringify(this.formatLog("info", message, context)));
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(JSON.stringify(this.formatLog("warn", message, context)));
    }
  }

  public error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      console.error(JSON.stringify(this.formatLog("error", message, context)));
    }
  }
}

export const logger = new Logger("openlearning");
