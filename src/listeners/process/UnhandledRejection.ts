import { Listener, ListenerOptions } from 'discord-akairo';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('unhandledRejection', {
  emitter: 'process',
  event: 'unhandledRejection',
})
export default class UnhandledRejectionListener extends Listener {
  public exec(reason: Error, promise: Promise<unknown>): void {
    this.client.prom.metrics.errorCounter.inc();
    Logger.fatal('Encountered an unhandled rejection: ', promise);
  }
}
