import type { CommandOptions } from '@arimajs/discord-akairo';
import type { GuildMember, Message } from 'discord.js-light';
import { Playlist } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  member: GuildMember;
}

@ApplyOptions<CommandOptions>('playlists', {
  aliases: ['playlists', 'display-playlists', 'my-playlists'],
  description:
    "Display a preview of all your or another's playlists (accepts @ or [id](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-#:~:text=Obtaining%20User%20IDs))",
  usage: '[member]',
  examples: ['@Lioness100', '381490382183333899'],
  channel: 'guild',
  args: [
    {
      id: 'member',
      type: 'memberMention',
      description:
        'The member whose playlists to view (defaults to the command runner)',
      default: (message: Message) => message.member,
    },
  ],
})
export default class PlaylistsCommand extends Command {
  public async run(message: Message, { member }: Args): Promise<void> {
    const playlists = await Playlist.find({
      collaborators: member.id,
    })
      .select('title track_count')
      .lean();

    const prefix = await this.client.util.prefix(message.guild);
    const self = member.id === message.author.id || undefined;

    if (!playlists.length)
      return message.error(
        `${self ? 'You don' : `${member.user.tag} does`}n't have any playlists`,
        self && `Use \`${prefix}create-playlist\` to make one`
      );

    const numbers = ['one', 'two', 'three', 'four', 'five'];
    message.embed(
      `${self ? 'Your' : `${member.user.tag}'s`} Playlists`,
      (embed) =>
        embed
          .setDescription(
            playlists
              .sort((a, b) => b.track_count - a.track_count)
              .map(
                (playlist, idx) =>
                  `:${numbers[idx]}: "${playlist.title}" • ${playlist.track_count} Tracks`
              )
              .join('\n')
          )
          .setFooter(
            `Use \`${prefix}playlist-info ${
              self ? '' : `@${member.user.tag} `
            }<name>\` to see more about a playlist`
          )
    );
  }
}
