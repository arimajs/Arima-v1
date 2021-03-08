import { Listener, ListenerOptions } from '@arimajs/discord-akairo';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('uncaughtException', {
  emitter: 'process',
  event: 'uncaughtException',
})
export default class UncaughtExceptionListener extends Listener {
  public exec(error: Error): void {
    Logger.fatal('Encountered an uncaught exception: ', error);
  }
}
