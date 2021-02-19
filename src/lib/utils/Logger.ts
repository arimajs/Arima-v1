import { inspect } from 'util';
import { format } from 'date-fns';
import { logLevels } from './Constants';

export default class Logger {
  private static log(content: unknown[], level: keyof typeof logLevels) {
    console.log(this.format(content, level));
  }

  public static fatal(...content: unknown[]): void {
    this.log(content, 'fatal');
    process.exit(1);
  }

  public static error(...content: unknown[]): void {
    this.log(content, 'error');
  }

  public static warn(...content: unknown[]): void {
    this.log(content, 'warn');
  }

  public static info(...content: unknown[]): void {
    this.log(content, 'info');
  }

  public static debug(...content: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') this.log(content, 'debug');
  }

  private static format(content: unknown[], level: keyof typeof logLevels) {
    return [
      format(new Date(), '[dd/MM/yyyy H:mm:s]'),
      `${logLevels[level]}[${level.toUpperCase()}]\x1b[0m`,
      content
        .map((val) => (typeof val === 'string' ? val : inspect(val)))
        .join(''),
    ].join(' ');
  }
}
