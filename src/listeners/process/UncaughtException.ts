import { Listener, ListenerOptions } from 'discord-akairo';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('uncaughtException', {
  emitter: 'process',
  event: 'uncaughtException',
})
export default class UncaughtExceptionListener extends Listener {
  public exec(error: Error): void {
    this.client.prom.metrics.errorCounter.inc();
    Logger.fatal('Encountered an uncaught exception: ', error);
  }
}
