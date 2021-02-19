/* eslint-disable max-classes-per-file */

declare module 'discord-akairo' {
  interface AkairoClient {
    db: import('../lib/database/Database').default;
    player: import('../lib/structures/quiz/Player').default;
    prom: import('../lib/utils/PromClient').default;
    commandHandler: import('discord-akairo').CommandHandler;
    listenerHandler: import('discord-akairo').ListenerHandler;
    inhibitorHandler: import('discord-akairo').InhibitorHandler;
    games: import('discord.js-light').Collection<
      import('discord.js-light').Snowflake,
      import('../lib/structures/quiz/Game').default
    >;
  }

  interface Command {
    game?: boolean;
    examples?: string[];
    hidden?: boolean;
    usage?: string;
    argDescriptions: import('discord-akairo').ArgumentOptions[];
  }

  interface CommandOptions {
    game?: boolean;
    argDescriptions?: import('discord-akairo').ArgumentOptions[];
    examples?: string[];
    hidden?: boolean;
    usage?: string;
  }

  interface ClientUtil {
    emoji<C extends string, U extends string>(
      custom: C,
      unicode: U,
      channel: import('../lib/utils/types').TextBasedChannel
    ): C | U;
    prefix(guild: import('discord.js-light').Guild | null): Promise<string>;
    isBlue<C extends [number, number, number], S extends string>(
      color: C,
      ifSo: S
    ): C | S;
    getMemberInfo(
      member: GuildMember
    ): import('discord.js-light').EmbedFieldData[];
    embed(
      data?: MessageEmbedOptions
    ): import('../lib/structures/EnhancedEmbed').default;
    progressBar(value: number, max: number): string;
    upper(string: string): string;
    chunk<T>(arr: T[], size: number): T[][];
    ordinal(num: number): string;
    sample<T>(arr: T[]): T;
    escapeRegex(str: string): string;
    tap<T>(value: T): T;
    shuffle<T extends unknown[]>(arr: T): T;
  }
}

declare module 'discord.js' {
  interface Guild {
    game?: import('../lib/structures/quiz/Game').default;
  }

  interface Message {
    util: import('discord-akairo').CommandUtil;
    embed(
      title?: string,
      send:
        | boolean
        | ((
            embed: import('../lib/structures/EnhancedEmbed').default
          ) => unknown) = false,
      useUtil = true
    ): import('../lib/structures/EnhancedEmbed').default;
    error(message: string, explanation?: string, useUtil = true): void;
    reactAll(
      ...emojis:
        | import('discord.js-light').EmojiResolvable[]
        | import('discord.js-light').EmojiResolvable[][]
    ): Promise<void>;
    poll(id: import('discord.js-light').Snowflake): Promise<boolean>;
    attemptEdit(content: unknown): void;
  }
}

declare module 'colorthief' {
  export function getColor(
    image: import('../lib/utils/types').URL
  ): Promise<[number, number, number]>;
}

declare module 'soundcloud-scraper' {
  export const Store: Map<string, string>;

  export class Song {
    author: { name: string };

    duration: number;

    thumbnail: import('../lib/utils/types').URL;

    title: string;

    url: import('../lib/utils/types').URL;

    streams: { progressive: import('../lib/utils/types').URL };
  }

  export interface Playlist {
    title: string;
    url: import('../lib/utils/types').URL;
    thumbnail: import('../lib/utils/types').URL;
    author: {
      name: string;
    };
    tracks: Song[];
    trackCount: number;
  }

  export class Client {
    getPlaylist(url: import('../lib/utils/types').URL): Promise<Playlist>;

    getSongInfo(url: import('../lib/utils/types').URL): Promise<Song>;
  }

  export class Util {
    static validateURL(
      url: import('../lib/utils/types').URL,
      type?: 'track' | 'playlist'
    ): boolean;

    static fetchSongStreamURL(
      url: import('../lib/utils/types').URL,
      clientID: string
    ): Promise<string>;
  }

  export class StreamDownloader {
    static downloadProgressive(
      url: import('../lib/utils/types').URL
    ): Promise<import('http').IncomingMessage>;
  }
}

declare module 'spotify-url-info' {
  interface ExternalURLArray {
    spotify: import('../lib/utils/types').URL;
  }

  export interface Song {
    album?: SongCollection;
    artists: { name: string }[];
    external_urls: ExternalURLArray;
    duration_ms: number;
    name: string;
  }

  export interface SongPreview {
    artist: string;
    title: string;
    image: import('../lib/utils/types').URL;
  }

  interface SongCollection {
    images: { url: import('../lib/utils/types').URL }[];
    external_urls: ExternalURLArray;
    name: string;
  }

  export interface Playlist extends SongCollection {
    owner: { display_name: string };
    tracks: { items: { track: Song }[] };
  }

  export interface Album extends SongCollection {
    artists: { name: string }[];
    tracks: { items: Song[] };
  }

  export function getData(
    url: import('../lib/utils/types').URL
  ): Promise<Song | Playlist | Album>;

  export function getPreview(
    url: import('../lib/utils/types').URL
  ): Promise<SongPreview>;
}
