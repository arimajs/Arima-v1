import type { CommandOptions } from '@arimajs/discord-akairo';
import { stripIndents } from 'common-tags';
import type { Message } from 'discord.js-light';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('vote', {
  aliases: ['vote'],
  description: 'Vote for Arima!',
})
export default class VoteCommand extends Command {
  public run(message: Message): void {
    message.embed('Vote for Arima', (embed) =>
      embed.setDescription(
        stripIndents`Voting for Arima really helps the team out!
    
        [Top.gg](https://top.gg/bot/809547125397782528)
        [Discord Bot List](https://discordbotlist.com/bots/arima/upvote)

        [Infinity Bot List](https://infinitybots.xyz/bots/809547125397782528/vote)
        [Unique Bot List](https://uniqbotlist.ga/bots/like/809547125397782528)
        [Discord List](https://discord-list.cf/bots/like/809547125397782528)
        [Paradise Bot List](https://paradisebots.net/bots/809547125397782528/vote)
        [Void Bot List](https://voidbots.net/bot/809547125397782528/vote)
        [Blist](https://blist.xyz/bot/809547125397782528/vote)
        [Extreme Bot List](https://discordextremelist.xyz/en-US/bots/809547125397782528/upvote)
        [DBots](https://dbots.co/dashboard/bots/809547125397782528)
        [Blade Bot List](https://bladebotlist.xyz/bot/809547125397782528/vote)`
      )
    );
  }
}
