import { Listener, ListenerOptions } from '@arimajs/discord-akairo';
import { Poster } from 'dbots';
import { Logger, ApplyOptions } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('ready', {
  emitter: 'client',
  event: 'ready',
})
export default class ReadyListener extends Listener {
  public exec(): void {
    Logger.info(`Bot logged in as ${this.client.user?.tag ?? 'Unknown#0000'}`);

    // initialize statcord poster
    this.client.stats
      ?.autopost()
      .catch((e) => Logger.fatal('Error when posting to statcord: ', e));

    // initialize bot list poster
    this.client.poster = new Poster({
      client: this.client,
      apiKeys: {
        astrobotlist: process.env.ASTRO_BOT_LIST_TOKEN!,
        bladebotlist: process.env.BLADE_BOT_LIST_TOKEN!,
        blist: process.env.BLIST_BOT_LIST_TOKEN!,
        botlistspace: process.env.SPACE_BOT_LIST_TOKEN!,
        dbots: process.env.DBOTS_BOT_LIST_TOKEN!,
        botsfordiscord: process.env.BOTS_FOR_DISCORD_BOT_LIST_TOKEN!,
        discordboats: process.env.DISCORD_BOATS_BOT_LIST_TOKEN!,
        discordbotlist: process.env.DISCORD_BOT_LIST_TOKEN!,
        discordbotsgg: process.env.DISCORD_BOTS_GG_BOT_LIST_TOKEN!,
        discordextremelist: process.env.DISCORD_EXTREME_LIST_BOT_LIST_TOKEN!,
        discordlistology: process.env.DISCORD_LISTOLOGY_BOT_LIST_TOKEN!,
        discordservices: process.env.DISCORD_SERVICES_BOT_LIST_TOKEN!,
        infinitybots: process.env.INFINITY_BOT_LIST_TOKEN!,
        topgg: process.env.TOP_GG_BOT_LIST_TOKEN!,
        voidbots: process.env.VOID_BOT_LIST_TOKEN!,
        yabl: process.env.YET_ANOTHER_BOT_LIST_TOKEN!,
      },
      clientLibrary: 'discord.js',
    });

    if (process.env.NODE_ENV === 'production') {
      // post every five minutes
      this.client.poster.startInterval();
    }
  }
}
