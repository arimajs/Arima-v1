import { cpuUsage } from 'os-utils';
import { Listener, ListenerOptions } from '@arimajs/discord-akairo';
import { Logger, ApplyOptions } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('ready', {
  emitter: 'client',
  event: 'ready',
})
export default class ReadyListener extends Listener {
  public exec(): void {
    Logger.info(`Bot logged in as ${this.client.user?.tag ?? 'Unknown#0000'}`);
    this.client.prom.metrics.serversJoined.set(
      {},
      this.client.guilds.cache.size
    );

    setInterval(() => {
      this.client.prom.metrics.ramUsage.set(
        {},
        process.memoryUsage().heapUsed / 1024 / 1024
      );

      this.client.prom.metrics.ping.set({}, this.client.ws.ping);

      cpuUsage((percentage) =>
        this.client.prom.metrics.cpuUsage.set({}, percentage)
      );
    }, 5e3);
  }
}
