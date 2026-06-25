/**
 * Frontend Logger Utility
 *
 * Provides structured logging for frontend with correlation ID support
 */

interface LogData {
  [key: string]: any;
}

class FrontendLogger {
  private readonly service = 'frontend';

  /**
   * Generate ISO8601 timestamp
   */
  private timestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Format log entry as JSON
   */
  private format(level: string, message: string, data?: LogData): string {
    return JSON.stringify({
      timestamp: this.timestamp(),
      level,
      service: this.service,
      environment: process.env.NODE_ENV || 'development',
      message,
      ...data,
    });
  }

  /**
   * Log info-level message
   */
  info(message: string, data?: LogData): void {
    console.log(this.format('INFO', message, data));
  }

  /**
   * Log warning-level message
   */
  warn(message: string, data?: LogData): void {
    console.warn(this.format('WARN', message, data));
  }

  /**
   * Log error-level message
   */
  error(message: string, error?: Error, data?: LogData): void {
    console.error(
      this.format('ERROR', message, {
        error: error?.message,
        stack: error?.stack,
        ...data,
      })
    );
  }

  /**
   * Log debug-level message (only in development)
   */
  debug(message: string, data?: LogData): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.format('DEBUG', message, data));
    }
  }
}

// Export singleton instance
export const logger = new FrontendLogger();
