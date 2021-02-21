import type { CommandOptions } from '@arimajs/discord-akairo';
import type { GuildMember, Message, Snowflake } from 'discord.js-light';
import { User } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  member: GuildMember;
}

@ApplyOptions<CommandOptions>('level', {
  aliases: ['level', 'exp', 'xp'],
  description:
    'View your or someone elses XP stats (accepts @ or [id](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-#:~:text=Obtaining%20User%20IDs)). XP is earned at the end of each game played (`songsWon / songsPlayed * minutesPlayed`)',
  usage: '[member]',
  examples: ['@Lioness100', '381490382183333899'],
  channel: 'guild',
  args: [
    {
      id: 'member',
      type: 'memberMention',
      description:
        'The member whose XP to view (defaults to the command runner)',
      default: (message: Message) => message.member,
    },
  ],
})
export default class LevelCommand extends Command {
  public async run(message: Message, { member }: Args): Promise<void> {
    const self = member.id === message.author.id;
    const users = await User.find({ xp: { $gt: 0 } })
      .select('id level xp')
      .sort({ xp: -1 })
      .lean();
    const index = ((users as unknown) as { id: Snowflake }[]).findIndex(
      ({ id }) => id === member.id
    );

    const user = users[index];
    if (!user)
      return message.error(
        `${self ? 'You have' : `${member.user.tag} has`} no XP :star:`
      );

    const members = await message.guild!.members.fetch(false);
    void message.channel.send(
      this.client.util
        .embed()
        .personalize(member)
        .setTitle(`${self ? 'Your' : `${member.user.tag}'s`} XP Stats`)
        .addFields([
          { name: 'XP ⭐', value: Math.round(user.xp), inline: true },
          { name: 'Level', value: `Level ${user.level}`, inline: true },
          {
            name: 'Leaderboard Position (Global)',
            value: `${this.client.util.ordinal(index + 1)} Place`,
          },
          {
            name: 'Leaderboard Position (Guild)',
            value: `${this.client.util.ordinal(
              ((users as unknown) as { id: Snowflake }[])
                .filter(({ id }) => members.has(id))
                .findIndex(({ id }) => id === member.id) + 1
            )} Place`,
          },
          {
            name: 'Points Needed to Level Up',
            value: `${Math.round(
              User.xpFor(user.level + 1) - user.xp
            )} XP\n\nTo next level:\n${this.client.util.progressBar(
              Math.round(User.xpFor(user.level + 1) - user.xp),
              Math.round(User.xpFor(user.level + 1) - User.xpFor(user.level))
            )}`,
          },
        ])
    );
  }
}
