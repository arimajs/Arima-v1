import { Listener, ListenerOptions } from 'discord-akairo';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<ListenerOptions>('guildDelete', {
  event: 'guildDelete',
  emitter: 'client',
})
export default class Command extends Listener {
  public exec(): void {
    this.client.prom.metrics.serversJoined.dec();
    // TODO update top.gg listing
  }
}
