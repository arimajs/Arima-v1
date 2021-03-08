import {
  CommandOptions,
  // Argument,
  ArgumentOptions,
  ArgumentTypeCaster,
} from '@arimajs/discord-akairo';
import type { Message, GuildMember } from 'discord.js-light';
import { getColor } from 'colorthief';
import { Playlist as PlaylistDoc } from '../../lib/database';
import Playlist from '../../lib/database/entities/Playlist';
import ArimaClient from '../../lib/client/ArimaClient';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  member: GuildMember;
  playlist: Playlist;
  // name: string;
}

@ApplyOptions<CommandOptions>('clone', {
  aliases: ['clone', 'copy', 'fork'],
  description:
    "Clone another person's playlist! This way you can play with it without modifying the original",
  usage: '<member> <playlist>', // '<member> <playlist> [--name <name>]'
  examples: [
    '@Lioness100 sparkles',
    '381490382183333899 classical', // '381490382183333899 classical --name "Classically Classical"',
  ],
  channel: 'guild',
  argDescriptions: [
    {
      id: 'member',
      type: 'memberMention',
      description: 'The member whose playlist to view',
    },
    {
      id: 'playlist',
      type: 'playlist',
      match: 'rest',
      description: 'The name of the custom playlist to clone',
    },
    /* {
      id: 'name',
      type: 'string',
      match: 'flag',
      description:
        'What to name the new playlist (defaults to what it was already named)',
    }, */
  ],
  *args(): Generator<ArgumentOptions> {
    const member = (yield {
      type: 'memberMention',
      prompt: {
        start: "Who's playlist do you want to clone?",
        retry: 'Please provide a valid member mention or id',
      },
    }) as GuildMember;

    const playlist = (yield {
      type: ((message, phrase) => {
        const playlist = Playlist.resolvePlaylist(
          phrase,
          message.client as ArimaClient,
          member.id,
          true,
          true
        );

        return typeof playlist === 'string' ? null : playlist;
      }) as ArgumentTypeCaster,
      match: 'rest',
      prompt: {
        start: 'What playlist would you like to clone?',
        retry: `Please provide the name of one of ${member.user.tag}'s custom playlists`,
      },
    }) as Playlist;

    // TODO annoy computer1 until this is fixed
    // TODO a!rename-playlist and maybe other settings?
    // TODO statcord instead of prom-client
    // TODO Logger => Proxy
    // TODO DBots list
    /* const name = yield {
      type: Argument.validate(
        'string',
        (m, p, str: string) => str.length <= 20
      ),
      match: 'option',
      flag: ['--name', '-n'],
      default: () => playlist.name,
      prompt: {
        optional: true,
        retry: 'Please limit the name to 20 letters and try again',
      },
    }; */

    return { member, playlist /* , name */ };
  },
})
export default class CloneCommand extends Command {
  public async run(
    message: Message,
    { member, playlist /* , name */ }: Args
  ): Promise<void> {
    /* if (name.includes('@'))
      return message.error('Playlist names can\'t contain "@"'); */

    const playlists = await PlaylistDoc.find({
      collaborators: message.author.id,
    })
      .select('title')
      .lean();

    if (playlists.length >= 3)
      return message.error('You can only have 3 playlists');

    let sent: Promise<Message | void> = Promise.resolve();

    if (playlists.some(({ title }) => title === playlist.title /* name */)) {
      const num = playlists.some(({ title }) => title === `${playlist.title}-1`)
        ? 2
        : 1;
      sent = message.embed(
        `You already have a playlist named "${playlist.title}"`,
        (embed) =>
          embed.setDescription(
            `Setting the title to "${playlist.title}-${num}"`
          )
      );

      playlist.title += `-${num}`;
    }

    const thumbnail = message.author.displayAvatarURL({
      format: 'png',
      size: 4096,
    });

    const [color] = await Promise.all([
      getColor(thumbnail).catch(
        () => [52, 152, 219] as [number, number, number]
      ),
      sent,
    ]);

    await new PlaylistDoc({
      id: message.author.id,
      title: playlist.title /* name */,
      author: message.author.tag,
      collaborators: [message.author.id],
      thumbnail,
      tracks: playlist.tracks,
      track_count: playlist.track_count,
      color,
    }).save();

    message.embed(
      `Cloned and Saved Playlist "${playlist.title}" from ${member.user.tag}`,
      (embed) => embed.setColor(color).setThumbnail(playlist.thumbnail)
    );
  }
}
