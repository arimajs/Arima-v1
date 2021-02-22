import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message, Snowflake } from 'discord.js-light';
import { User } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  global: boolean;
}

@ApplyOptions<CommandOptions>('leaderboard', {
  aliases: ['leaderboard', 'lb'],
  description: "View this guild's leaderboard",
  channel: 'guild',
  cooldown: 5000,
  args: [
    {
      id: 'global',
      description: 'Whether to view the global leaderboard',
      match: 'flag',
      flag: ['--global', '-g'],
    },
  ],
})
export default class LeaderboardCommand extends Command {
  public async run(message: Message, { global }: Args): Promise<void> {
    const members = global
      ? null
      : (await message.guild!.members.fetch(false)).keyArray();
    const [rankLeaderboard, levelLeaderboard] = await Promise.all([
      User.find(
        global
          ? { matchesPlayed: { $gt: 0 } }
          : { id: { $in: members }, matchesPlayed: { $gt: 0 } }
      )
        .limit(5)
        .sort({ matchesWon: -1 })
        .select('id rank matchesWon matchesPlayed')
        .lean(),
      User.find(
        global ? { xp: { $gt: 0 } } : { id: { $in: members }, xp: { $gt: 0 } }
      )
        .limit(5)
        .sort({ xp: -1 })
        .select('id rank level xp')
        .lean(),
    ]);

    message.embed(
      `${global ? 'Global' : `${message.guild!.name}'s`} Leaderboard`,
      (embed) =>
        embed.addFields([
          {
            name: 'Rank',
            value: rankLeaderboard.length
              ? rankLeaderboard
                  .map((user, idx) => {
                    const emoji = User.getEmoji(user.rank, message.channel);
                    return `${this.client.util.ordinal(
                      idx + 1
                    )} Place • ${emoji} <@${
                      ((user as unknown) as { id: Snowflake }).id
                    }> ${emoji} • ${user.matchesWon}/${
                      user.matchesPlayed
                    } Matches Won (${(
                      user.matchesWon / user.matchesPlayed
                    ).toFixed(2)}%)`;
                  })
                  .join('\n')
              : "There's nobody here yet!",
          },
          {
            name: 'Level',
            value: levelLeaderboard.length
              ? levelLeaderboard
                  .map((user, idx) => {
                    const emoji = User.getEmoji(user.rank, message.channel);
                    return `${this.client.util.ordinal(
                      idx + 1
                    )} Place • ${emoji} <@${
                      ((user as unknown) as { id: Snowflake }).id
                    }> ${emoji} • Level ${user.level} (${Math.round(
                      user.xp
                    )} XP :star:)`;
                  })
                  .join('\n')
              : "There's nobody here yet!",
          },
        ])
    );
  }
}
