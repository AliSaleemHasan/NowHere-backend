import { ConsoleLogger, ConsoleLoggerOptions, LogLevel } from '@nestjs/common';
import { consoleSeperator } from '../constants';

export class NowHereLogger extends ConsoleLogger {
  constructor(context: string, options: ConsoleLoggerOptions) {
    super(context, options);

    const levels: LogLevel[] = options?.logLevels || [
      'log',
      'error',
      'warn',
      'debug',
      'verbose',
    ];

    for (const level of levels) {
      const original = this[level].bind(this);

      if (level === 'log') continue;
      this[level] = (...args: any[]) => {
        console.log(consoleSeperator(level));
        original(...args);
      };
    }
  }
}
