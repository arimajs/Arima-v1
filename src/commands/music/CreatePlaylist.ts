import { CommandOptions, Argument } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import { getColor } from 'colorthief';
import { Playlist } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  name: string;
}

@ApplyOptions<CommandOptions>('create-playlist', {
  aliases: ['create-playlist', 'new-playlist', 'add-playlist'],
  description:
    'Create a new playlist. **TIP:** Attach an image to set the playlist thumbnail',
  usage: '<name>',
  examples: ['vibing', 'classics'],
  cooldown: 5000,
  args: [
    {
      id: 'name',
      type: Argument.validate(
        'string',
        (m, p, str: string) => str.length <= 20
      ),
      match: 'rest',
      description: 'The name of the playlist',
      prompt: {
        start: 'What do you want to name the playlist?',
        retry: 'Please limit the name to 20 characters',
      },
    },
  ],
})
export default class CreatePlaylistCommand extends Command {
  public async run(message: Message, { name }: Args): Promise<void> {
    if (
      message.attachments.size &&
      !message.attachments.some((a) =>
        /\.(png|jpg|jpeg|gif|png|svg)$/.test(a.url)
      )
    )
      return message.error(
        'The playlist thumbnail can only be an image',
        'Accepted file extensions: `png`, `jpg`, `jpeg`, `gif`, `png`, and `svg`'
      );

    const playlists = await Playlist.find({
      id: message.author.id,
    })
      .select('title')
      .lean();

    if (playlists.some(({ title }) => title === name))
      return message.error('You already have a playlist by that name');

    // TODO: You can only have x playlists unless you support on patreon
    if (playlists.length >= 3)
      return message.error('You can only have 3 playlists');

    const thumbnail =
      message.attachments.find((a) =>
        /\.(png|jpg|jpeg|gif|png|svg)$/.test(a.url)
      )?.url ?? message.author.displayAvatarURL({ format: 'png', size: 4096 });

    const playlist = await new Playlist({
      id: message.author.id,
      title: name,
      author: message.author.tag,
      thumbnail,
      color: await getColor(thumbnail).catch(() => [52, 152, 219]),
    }).save();

    message.embed(`Saved Playlist "${playlist.title}"`, (embed) =>
      embed
        .setColor(playlist.color as [number, number, number])
        .setThumbnail(playlist.thumbnail)
    );
  }
}
