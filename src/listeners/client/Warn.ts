import { Listener, ListenerOptions } from 'discord-akairo';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('warn', {
  emitter: 'client',
  event: 'warn',
})
export default class WarnListener extends Listener {
  public exec(info: string): void {
    Logger.warn(info);
  }
}
