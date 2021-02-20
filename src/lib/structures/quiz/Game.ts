import {
  User,
  Guild,
  GuildMember,
  Message,
  MessageCollector,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
  Collection,
  Snowflake,
} from 'discord.js-light';
import { compareTwoStrings } from 'string-similarity';
import { differenceInMinutes, formatDistanceToNowStrict } from 'date-fns';
import ytsr from 'youtube-sr';
import ytdl from 'discord-ytdl-core';
import ArimaClient from '../../client/ArimaClient';
import Logger from '../../utils/Logger';
import { Playlist, Song } from '../../database/entities';
import { User as UserDoc } from '../../database';
import { Leaderboard, StreakCounter } from '..';
import { spotifySongRegex } from '../../utils/Constants';

export interface Player extends GuildMember {
  start: number;
  end?: number;
}

interface GameOptions {
  playlist: Playlist;
  text: TextChannel;
  connection: VoiceConnection;
  voice: VoiceChannel;
  host: GuildMember;
  answers: 'song' | 'artist' | 'all';
  goal?: number;
}

export default class Game {
  public client: ArimaClient;

  public connection: VoiceConnection;

  public playlist: Playlist;

  public text: TextChannel;

  public voice: VoiceChannel;

  public guild: Guild;

  public host: GuildMember;

  public goal: number;

  public players: Collection<Snowflake, Player>;

  public answers: 'song' | 'artist' | 'all';

  public songGenerator: Generator<Song, void, unknown>;

  public collector?: MessageCollector;

  public stream?: ReturnType<typeof ytdl['arbitraryStream']>;

  public current?: Song;

  public ended = false;

  public leaderboard = new Leaderboard();

  public streaks = new StreakCounter();

  public started = Date.now();

  public songsPlayed = 0;

  public constructor(options: GameOptions) {
    const {
      playlist,
      text,
      connection,
      host,
      answers,
      voice,
      goal = Infinity,
    } = options;

    this.client = text.client as ArimaClient;
    this.connection = connection.once('error', (err) => {
      void this.end('connection');
      Logger.error(`Connection error: ${err}`);
    });

    this.songGenerator = (function* (client: ArimaClient) {
      yield* client.util.shuffle(playlist.tracks);
    })(this.client);

    this.playlist = playlist;
    this.text = text;
    this.voice = voice;
    this.guild = text.guild;
    this.host = host;
    this.answers = answers;
    this.goal = goal;
    this.players = this.voice.members
      .filter((m) => !m.user.bot)
      .mapValues((m) => Object.assign(m, { start: Date.now() }));

    if (text.guild.game) throw new Error("There's already a game in process");

    text.guild.game = this;
    this.client.games.set(this.guild.id, this);
  }

  public async start(): Promise<void> {
    this.client.prom.metrics.matchStarted.inc();
    void this.text.send(
      this.client.util
        .embed()
        .setColor(
          await Promise.race([
            this.playlist.color,
            [52, 152, 219] as [number, number, number],
          ])
        )
        .setAuthor(
          `A new game has been started in #${this.text.name} (text) and #${this.voice.name} (voice)`
        )
        .setTitle(
          `The game has begun! Playing "${this.playlist.title}" by ${this.playlist.author}`
        )
        .setDescription(
          `You have 30 seconds to guess the name of the ${
            this.answers === 'all' ? 'song or artist' : this.answers
          }`
        )
        .setThumbnail(this.playlist.thumbnail)
        .setFooter(this.goal ? `Playing to ${this.goal} points` : '')
    );

    void this.playNext();
  }

  public async playNext(): Promise<void> {
    const song = this.songGenerator.next().value;
    if (!song) return void this.end('limit');

    if (spotifySongRegex.test(song.url)) {
      const video = await ytsr.searchOne(`${song.author} - ${song.title}`);
      if (!video || video.duration < 3e4) {
        void this.text.send(
          this.client.util
            .embed()
            .setColor('RED')
            .setTitle(`Could not find "${song.title}" by ${song.author}`)
            .setDescription('Skipping...')
        );
        return this.playNext();
      }
      song.url = video.url;
      song.duration = video.duration;
    }

    this.current = song;

    try {
      this.stream = await Song.stream(song);
      this.connection
        .play(this.stream, {
          type: 'opus',
          volume: 0.5,
        })
        .once('error', (err) => {
          void this.end('connection');
          Logger.error(`Connection error: ${err}`);
        })
        .once('start', () => {
          this.songsPlayed++;
          void this.listen();
        });
    } catch (err) {
      this.client.prom.metrics.errorCounter.inc();
      void this.end('connection');
    }
  }

  public async listen(): Promise<void> {
    const song = this.current!;
    this.collector = this.text.createMessageCollector(
      (message: Message) =>
        this.voice.members.has(message.author.id) &&
        this.validateAnswer(message.content),
      { max: 1, time: 30000 }
    );

    const color = await Promise.race([
      song.color,
      [52, 152, 219] as [number, number, number],
    ]);
    const embed = (guesser?: User) =>
      this.client.util
        .embed()
        .setTitle(`That was ${song.title} by ${song.author}`)
        .setDescription(guesser ? `${guesser} guessed it!` : 'Nobody got it!')
        .setThumbnail(song.thumbnail)
        .addField('Leaderboard', this.leaderboard.compute(10))
        .setColor(this.client.util.isBlue(color, 'RED'))
        .setFooter(
          `${
            (this.streaks.leader?.[1] ?? 0) > 2
              ? `${guesser!.tag} has a streak of ${this.streaks.leader![1]} 🔥${
                  this.goal ? ' • ' : ''
                }`
              : ''
          }${this.goal ? `Playing to ${this.goal} points` : ''}`
        );

    this.collector.once(
      'collect',
      (message: Message) =>
        void (async () => {
          this.current = undefined;

          this.collector!.stop('collected');
          this.leaderboard.inc(message.author.id);
          this.streaks.addStreak(message.author.id);

          await this.text.send(
            embed(message.author).personalize(message.author)
          );

          if (this.goal === this.leaderboard.leader![1])
            return this.end('goal');

          void this.playNext();
        })()
    );

    this.collector.once('end', (collection, reason) => {
      if (reason !== 'time' || this.current?.title !== song.title || this.ended)
        return;
      this.streaks.removeAll();
      void this.text.send(embed());
      void this.playNext();
    });
  }

  public validateAnswer(answer: string): boolean {
    const validateSong = () =>
      [
        compareTwoStrings(
          this.current?.title.replace(/ \(.*| - .*/g, '').toLowerCase() ?? '',
          answer.toLowerCase()
        ),
        compareTwoStrings(
          this.current?.title.replace(/.* -/g, '').toLowerCase() ?? '',
          answer.toLowerCase()
        ),
        compareTwoStrings(
          this.current?.title.toLowerCase() ?? '',
          answer.toLowerCase()
        ),
      ].some((num) => num > 0.45);

    const validateArtist = () =>
      compareTwoStrings(
        this.current?.author.toLowerCase() ?? '',
        answer.toLowerCase()
      ) > 0.45;

    switch (this.answers) {
      case 'song':
        return validateSong();
      case 'artist':
        return validateArtist();
      default:
        return validateArtist() || validateSong();
    }
  }

  public async end(
    reason: 'limit' | 'end' | 'goal' | 'host' | 'connection'
  ): Promise<void> {
    this.client.games.delete(this.guild.id);
    this.ended = true;
    this.guild.game = undefined;
    this.connection.disconnect();
    this.stream?.destroy();
    this.collector?.stop('force');

    if (!this.guild.me) return;
    if (this.voice.members.has(this.client.user!.id)) this.voice.leave();

    const leader = await this.client.users
      .fetch(this.leaderboard.leader?.[0] as string)
      .catch(() => null);

    let description = '';
    switch (reason) {
      case 'connection': {
        description =
          ':x: Sorry, the game ended because I had trouble streaming one of the songs. Please try again later';
        break;
      }
      case 'limit': {
        description = 'You played through every song on the playlist!';
        break;
      }
      case 'goal': {
        description = `The goal of **${this.goal}** :goal: was hit!`;
        break;
      }
      case 'host': {
        description = 'The game host left';
        break;
      }
      default:
    }

    await this.text.send(
      this.client.util
        .embed()
        .setColor(['connection', 'force'].includes(reason) ? 'RED' : 'BLUE')
        .setTitle(
          this.leaderboard.leader
            ? `:tada: ${leader?.tag ?? 'Unknown#0000'} won :tada:`
            : '😔 Nobody Won'
        )
        .setDescription(description)
        .setThumbnail(
          leader?.displayAvatarURL({ dynamic: true, size: 4096 }) ?? ''
        )
        .addFields([
          {
            name: 'Time Elapsed',
            value: formatDistanceToNowStrict(this.started),
            inline: true,
          },
          {
            name: 'Tracks Played',
            value: this.songsPlayed,
            inline: true,
          },
          {
            name: 'Leaderboard',
            value: this.leaderboard.compute(20),
          },
        ])
        .setFooter('Nice job! Play again?')
    );

    if (this.songsPlayed) {
      await Promise.all(
        this.players.map(async (member) => {
          const xp = Math.round(
            ((this.leaderboard.get(member.id) || 0) / this.songsPlayed) *
              differenceInMinutes(member.end || Date.now(), member.start) *
              (member.id === leader?.id ? 1500 : 1000)
          );

          const matches = this.leaderboard.get(member.id) || 0;

          const user =
            (await UserDoc.findOne({ id: member.id }).select(
              'xp level songsGuessed matchesPlayed matchesWon rank'
            )) || new UserDoc({ id: member.id });

          const [rankUp, levelUp] = [
            user.appendMatch(matches, leader?.id === member.id),
            user.appendXp(xp),
          ];

          await user.save();
          if (!xp && !rankUp) return null;

          const emoji = UserDoc.getEmoji(user.rank, this.text);
          await this.text.send(
            `${member} ${emoji}, you earned :star: **${xp}** XP${
              levelUp ? ` and have leveled up to Level **${user.level}**` : ''
            }!${
              rankUp
                ? ` You also ranked up to a${
                    user.rank.startsWith('e') ? 'n' : ''
                  } ${emoji} **${this.client.util.upper(
                    user.rank
                  )} Musician** ${emoji} thanks to your epic song-guessing skills!`
                : ''
            }`
          );
        })
      );
    }
  }

  public skip(): void {
    if (this.ended) return;
    const song = this.current!;
    void this.text.send(
      this.client.util
        .embed()
        .setTitle(`That was ${song.title} by ${song.author}`)
        .setDescription('Song skipped')
        .setThumbnail(song.thumbnail)
        .addField('Leaderboard', this.leaderboard.compute(10))
        .setColor('RED')
        .setFooter(this.goal ? `Playing to ${this.goal} points` : '')
    );
    void this.playNext();
  }
}
