/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}]: ${message}`;
  }

  public info(message: string, ...meta: any[]): void {
    console.log(this.formatMessage(LogLevel.INFO, message), ...meta);
  }

  public warn(message: string, ...meta: any[]): void {
    console.warn(this.formatMessage(LogLevel.WARN, message), ...meta);
  }

  public error(message: string, error?: Error | any): void {
    const errorMsg = error instanceof Error ? `${error.message}\n${error.stack}` : JSON.stringify(error);
    console.error(this.formatMessage(LogLevel.ERROR, message), errorMsg || '');
  }

  public debug(message: string, ...meta: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), ...meta);
    }
  }
}

export class LoggerFactory {
  public static getLogger(context: string): Logger {
    return new Logger(context);
  }
}
