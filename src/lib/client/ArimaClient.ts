import { join } from 'path';
import {
  AkairoClient,
  CommandHandler,
  InhibitorHandler,
  ListenerHandler,
  Flag,
} from '@arimajs/discord-akairo';
import { Collection, Message, MessageReaction, User } from 'discord.js-light';
import { Client } from 'soundcloud-scraper';
import { ArimaUtil, Logger, PromClient } from '../utils';
import { Database, Guild } from '../database';
import { Playlist, Song } from '../database/entities';
import { Game } from '../structures';

export default class ArimaClient extends AkairoClient {
  public db = new Database();

  public util: ArimaUtil = new ArimaUtil(this);

  public soundcloud = new Client();

  public prom = new PromClient();

  public commandHandler: CommandHandler = new CommandHandler(this, {
    directory: join(__dirname, '../../commands'),
    prefix: async (message: Message) =>
      (await Guild.findOne({ id: message.guild?.id }).select('prefix').lean())
        ?.prefix || process.env.PREFIX!,
    defaultCooldown: 2e3,
    automateCategories: true,
    aliasReplacement: /-/g,
    argumentDefaults: {
      prompt: {
        retries: 3,
        retry: (message: Message) =>
          message
            .embed('Invalid reply; please try again')
            .setDescription(
              'You can respond with `cancel` to cancel the prompt'
            )
            .setColor('RED'),
        timeout: (message: Message) =>
          message.embed('You ran out of time').setColor('RED'),
        ended: (message: Message) =>
          message.embed('Too many attempts').setColor('RED'),
        cancel: (message: Message) => message.embed('Prompt Canceled'),
        modifyStart: (message: Message, text: unknown) =>
          typeof text === 'string'
            ? message
                .embed(text)
                .setDescription(
                  'You can respond with `cancel` to cancel the prompt'
                )
            : text,
        modifyRetry: (message: Message, text: unknown) =>
          typeof text === 'string'
            ? message
                .embed(text)
                .setDescription(
                  'Try again or respond with `cancel` to cancel the prompt'
                )
                .setColor('RED')
            : text,
      },
    },
  });

  public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
    directory: join(__dirname, '../../inhibitors'),
  });

  public listenerHandler: ListenerHandler = new ListenerHandler(this, {
    directory: join(__dirname, '../../listeners'),
    automateCategories: true,
  });

  public games = new Collection<string, Game>();

  public constructor() {
    super(
      {
        ownerID: '381490382183333899',
      },
      {
        presence: {
          activity: {
            type: 'LISTENING',
            name: 'music 🎶 | a!help',
          },
        },
        disableMentions: 'everyone',
        ws: {
          intents: [
            'GUILDS',
            'GUILD_MEMBERS',
            'GUILD_VOICE_STATES',
            'GUILD_MESSAGES',
            'GUILD_MESSAGE_REACTIONS',
            'DIRECT_MESSAGES',
            'DIRECT_MESSAGE_REACTIONS',
          ],
        },
        cacheRoles: true,
        cacheOverwrites: true,
        disabledEvents: [
          'GUILD_ROLE_CREATE',
          'GUILD_ROLE_DELETE',
          'CHANNEL_CREATE',
          'CHANNEL_DELETE',
          'MESSAGE_DELETE_BULK',
          'MESSAGE_DELETE',
          'MESSAGE_UPDATE',
          'MESSAGE_REACTION_REMOVE_EMOJI',
          'MESSAGE_REACTION_REMOVE_ALL',
          'MESSAGE_REACTION_REMOVE',
          'CHANNEL_PINS_UPDATE',
          'GUILD_MEMBER_ADD',
          'GUILD_MEMBER_UPDATE',
          'GUILD_MEMBER_REMOVE',
        ],
      }
    );
  }

  public async start(): Promise<void> {
    await this.init();
    void this.login(
      process.env.NODE_ENV === 'production'
        ? process.env.PROD_TOKEN
        : process.env.DEV_TOKEN
    );
  }

  private async init(): Promise<void> {
    Logger.info('Starting up...');

    this.commandHandler
      .useInhibitorHandler(this.inhibitorHandler)
      .useListenerHandler(this.listenerHandler)
      .loadAll();

    const validate = (val: unknown) =>
      typeof val === 'string' ? Flag.fail(val) : val;

    this.commandHandler.resolver.addTypes({
      'lean-playlist': async (message, phrase) =>
        validate(
          await Playlist.resolvePlaylist(
            phrase,
            this,
            message.author.id,
            true,
            true
          )
        ),
      'custom-playlist': async (message, phrase) =>
        validate(
          await Playlist.resolvePlaylist(phrase, this, message.author.id, true)
        ),
      playlist: async (message, phrase) => {
        const playlist = await Playlist.resolvePlaylist(
          phrase,
          this,
          message.author.id,
          false,
          true
        );
        let updatedPlaylist: Playlist | undefined;
        if (Array.isArray(playlist)) {
          const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].slice(
            0,
            playlist.length
          );
          const emotes = [...numbers, '❌'];

          const sent = await message.embed('Search Results', (embed) =>
            embed
              .setDescription(
                playlist
                  .map(
                    (playlist, idx) =>
                      `${numbers[idx]} ["${playlist.title}" by ${
                        playlist.channel!.name
                      }](${playlist.url})`
                  )
                  .join('\n')
              )
              .setFooter('Please pick a playlist')
          );
          void sent.reactAll(emotes);

          const collected = await sent.awaitReactions(
            (reaction: MessageReaction, user: User) =>
              emotes.includes(reaction.emoji.name) &&
              user.id === message.author.id,
            { max: 1, time: 30000 }
          );
          if (!collected.size || collected.first()!.emoji.name === '❌') {
            message.error(
              'Selection Canceled',
              collected.size ? undefined : 'You ran out of time'
            );
            return Flag.cancel();
          }
          updatedPlaylist = Playlist.mapYoutubePlaylist(
            this.util.tap(
              playlist[
                this.util.tap(
                  numbers.findIndex(
                    (num) => num === collected.first()!.emoji.name
                  )
                )
              ]
            )
          );
        }
        return validate(updatedPlaylist || playlist);
      },
      song: async (message, phrase) => {
        const song = await Song.resolveSong(phrase, this);
        let updatedSong: Song | undefined;
        if (Array.isArray(song)) {
          const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].slice(0, song.length);
          const emotes = [...numbers, '❌'];
          const sent = await message.embed('Search Results', (embed) =>
            embed
              .setDescription(
                song
                  .map(
                    (song, idx) =>
                      `${numbers[idx]} ["${song.title}" by ${
                        song.channel!.name
                      }](${song.url})`
                  )
                  .join('\n')
              )
              .setFooter('Please pick a song')
          );
          void sent.reactAll(emotes);

          const collected = await sent.awaitReactions(
            (reaction: MessageReaction, user: User) =>
              emotes.includes(reaction.emoji.name) &&
              user.id === message.author.id,
            { max: 1, time: 30000 }
          );
          if (!collected.size || collected.first()!.emoji.name === '❌') {
            message.error(
              'Selection Canceled',
              collected.size ? undefined : 'You ran out of time'
            );
            return Flag.cancel();
          }
          updatedSong = Song.mapYoutubeVideo(
            song[
              numbers.findIndex((num) => num === collected.first()!.emoji.name)
            ]
          );
          void sent.delete();
        }
        return validate(updatedSong || song);
      },
    });

    this.inhibitorHandler.loadAll();
    Logger.info(`Loaded ${this.inhibitorHandler.modules.size} inhibitors`);

    this.listenerHandler.setEmitters({
      process,
      commandHandler: this.commandHandler,
    });

    this.listenerHandler.loadAll();
    Logger.info(`Loaded ${this.listenerHandler.modules.size} listeners`);

    await this.db.init();
    Logger.info('Established connection to database');

    this.prom.init();
    Logger.info(
      `Created Prometheus server at http://localhost:${process.env.PORT}/metrics`
    );
  }
}
