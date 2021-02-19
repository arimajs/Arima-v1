import type { CommandOptions } from 'discord-akairo';
import type { GuildMember, Message, Snowflake } from 'discord.js-light';
import { User } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  member: GuildMember;
}

@ApplyOptions<CommandOptions>('rank', {
  aliases: ['rank'],
  description:
    'View your or someone elses rank (accepts @ or [id](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-#:~:text=Obtaining%20User%20IDs)). Your rank is the sum of all games won',
  usage: '[member]',
  examples: ['@Lioness100', '381490382183333899'],
  channel: 'guild',
  args: [
    {
      id: 'member',
      type: 'memberMention',
      description:
        'The member whose rank to view (defaults to the command runner)',
      default: (message: Message) => message.member,
    },
  ],
})
export default class LevelCommand extends Command {
  public async run(message: Message, { member }: Args): Promise<void> {
    const self = member.id === message.author.id;
    const users = await User.find({ xp: { $gt: 0 } })
      .select('id rank matchesWon matchesPlayed')
      .sort({ xp: 1 })
      .lean();
    const index = ((users as unknown) as { id: Snowflake }[]).findIndex(
      ({ id }) => id === member.id
    );

    const user = users[index];
    if (!user)
      return message.error(
        `${self ? 'You have' : `${member.user.tag} has`}n't won any games`
      );

    const emoji = User.getEmoji(user.rank, message.channel);
    const members = await message.guild!.members.fetch(false);
    void message.channel.send(
      this.client.util
        .embed()
        .personalize(member)
        .setTitle(`${self ? 'Your' : `${member.user.tag}'s`} Rank`)
        .addFields([
          {
            name: 'Win Ratio',
            value: `${user.matchesWon}/${user.matchesPlayed} Matches Won (${(
              user.matchesWon / user.matchesPlayed
            ).toFixed(2)}%)`,
            inline: true,
          },
          {
            name: 'Rank',
            value: `${emoji} ${this.client.util.upper(
              user.rank
            )} Musician ${emoji}`,
            inline: true,
          },
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
            name: 'Wins Needed to Level Up',
            value: `${
              User.matchesFor(User.rankFor(user.matchesWon + 10)) -
              user.matchesPlayed
            } Wins\n\nTo next rank:\n${this.client.util.progressBar(
              User.matchesFor(User.rankFor(user.matchesWon + 10)) -
                user.matchesPlayed,
              User.matchesFor(User.rankFor(user.matchesWon + 10)) -
                User.matchesFor(user.rank)
            )}`,
          },
        ])
    );
  }
}
