import { Listener, ListenerOptions } from '@arimajs/discord-akairo';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('error', {
  emitter: 'client',
  event: 'error',
})
// TODO COOOOOOLDOWNSSS
// TODO ALIASES
export default class ErrorListener extends Listener {
  public exec(info: string): void {
    Logger.error(info);
  }
}
