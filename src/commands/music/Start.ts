import {
  Argument,
  CommandOptions,
  Flag,
  PromptContentSupplier,
} from 'discord-akairo';
import { Document } from 'mongoose';
import type { Message, TextChannel, VoiceChannel } from 'discord.js';
import type Playlist from '../../lib/database/entities/Playlist';
import { Command, Game } from '../../lib/structures';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  playlist: Playlist;
  goal?: number;
  answers: 'song' | 'artist' | 'all';
}

@ApplyOptions<CommandOptions>('start', {
  aliases: ['start', 'play', 'new-game'],
  description: 'Start a new quiz',
  usage: '<playlist url/uri/name> [goal] [--answers <artist | song | all>]',
  examples: [
    'myPlaylist 15',
    'spotify:playlist:4SX7KOjWY0THyiNjDSsA9U --answers=artist',
  ],
  args: [
    {
      id: 'playlist',
      type: 'playlist',
      match: 'rest',
      description:
        'The playlist to play from. This can be a Spotify album or playlist url/uri, a Souncloud playlist url, a Youtube playlist url, the name of a custom playlist you created through `a!create-playlist`, or quoted playlist keywords to search on youtube (inconsistent)',
      prompt: {
        start: ((message) =>
          message
            .embed('What playlist would you like to play from?')
            .setDescription(
              'You can use a Spotify album or playlist url/uri, a Souncloud playlist url, a Youtube playlist url, the name of a custom playlist you created through `a!create-playlist`, or playlist keywords to search on youtube (inconsistent)'
            )
            .setFooter(
              'Respond with `cancel` to cancel'
            )) as PromptContentSupplier,
        retry: ((message, { failure }) =>
          (failure as Flag & { value: string }).value === 'NO_RESULTS'
            ? "I couldn't find any playlists!"
            : 'There are no tracks on that playlist!') as PromptContentSupplier,
      },
    },
    {
      id: 'goal',
      description: 'The number of points to play to, if any',
      match: 'option',
      flag: ['--goal', '-g'],
      type: Argument.range('number', 2, Infinity),
      prompt: {
        optional: true,
        retry: 'Please make sure the goal is a number above 2',
      },
    },
    {
      id: 'answers',
      description: 'Type of answers to accept (song only, artist only, or all)',
      type: ['song', 'artist', 'all'],
      match: 'option',
      flag: ['--answers', '--answer', '-a'],
      default: 'all',
      prompt: {
        optional: true,
        retry: 'Accepted options for `answers` are song, artist, and all',
      },
    },
  ],
  clientPermissions: [
    'CONNECT',
    'SPEAK',
    'DEAFEN_MEMBERS',
    'ADD_REACTIONS',
    'MANAGE_MESSAGES',
    'READ_MESSAGE_HISTORY',
  ],
  game: false,
})
export default class StartCommand extends Command {
  public async run(
    message: Message,
    { playlist, goal, answers }: Args
  ): Promise<void> {
    if (
      !(playlist instanceof Document) &&
      playlist.tracks.some((song) => song.duration < 3e4)
    ) {
      await message.channel.send(
        this.client.util
          .embed()
          .personalize(message.author)
          .setColor('BLUE')
          .setTitle(
            'Filtering out songs with a duration of less than 30 seconds...'
          )
      );
      playlist.tracks = playlist.tracks.filter((song) => song.duration < 3e4);
    }

    if (playlist.tracks.length < 5)
      return message.error('Please provide a playlist with more than 5 songs');

    if (!message.member!.voice.channelID)
      return message.error("You're not in a voice channel");

    if (!message.member!.voice.channel!.joinable)
      return message.error(
        "I can't join this voice channel",
        "This could be because I don't have permissions to see/connect to the channel, or the channel is full"
      );

    if (!message.member!.voice.channel!.speakable)
      return message.error(
        "I don't have the permissions to speak in that channel"
      );

    const connection = await message
      .member!.voice.channel!.join()
      .catch(() => null);

    if (!connection?.voice?.channelID) {
      if (message.guild!.me!.voice.channel)
        void message.guild!.me!.voice.channel?.leave();
      return message.error('There was an error joining the voice channel');
    }

    await message.guild!.me!.voice.setDeaf(true);

    const [text, voice] = (await Promise.all([
      this.client.channels.fetch(message.channel.id, false),
      this.client.channels.fetch(connection.voice.channelID, false),
    ])) as [TextChannel, VoiceChannel];

    try {
      void new Game({
        playlist,
        text,
        voice,
        connection,
        host: message.member!,
        answers,
        goal,
      }).start();
    } catch (err) {
      message.error("There's already a game in progress");
    }
  }
}
