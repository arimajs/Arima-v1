import { Listener, ListenerOptions } from 'discord-akairo';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('error', {
  emitter: 'client',
  event: 'error',
})
export default class ErrorListener extends Listener {
  public exec(info: string): void {
    Logger.error(info);
  }
}
