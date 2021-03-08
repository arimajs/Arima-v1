import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import { User as UserDoc } from 'src/lib/database/entities';
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
  cooldown: 10000,
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
    const [rankLeaderboard, levelLeaderboard] = await Promise.all<
      UserDoc[],
      UserDoc[]
    >([
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

    const tags =
      global &&
      new Map(
        await Promise.all(
          [
            ...new Set(
              rankLeaderboard.concat(levelLeaderboard).map(({ id }) => id)
            ),
          ].map(
            async (id) =>
              [
                id,
                (await this.client.users.fetch(id).catch(() => null))?.tag,
              ] as const
          )
        )
      );

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
                    return `${this.client.util.ordinal(idx + 1)} • ${emoji} ${
                      tags
                        ? tags.get(user.id) ?? 'Unknown#4566'
                        : `<@${user.id}>`
                    } ${emoji} • ${user.matchesWon}/${
                      user.matchesPlayed
                    } Matches Won (${(
                      (user.matchesWon / user.matchesPlayed) *
                      100
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
                    return `${this.client.util.ordinal(idx + 1)} • ${emoji} ${
                      tags
                        ? tags.get(user.id) ?? 'Unknown#4566'
                        : `<@${user.id}>`
                    } ${emoji} • Level ${Math.floor(user.level)} (${Math.floor(
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
