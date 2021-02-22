/* eslint-disable max-classes-per-file */
declare module 'soundcloud-scraper' {
  import type { IncomingMessage } from 'http';
  import type { URL } from '../lib/utils/types';

  export const Store: Map<string, string>;

  export class Song {
    author: { name: string };

    duration: number;

    thumbnail: URL;

    title: string;

    url: URL;

    streams: { progressive: URL };
  }

  export interface Playlist {
    title: string;
    url: URL;
    thumbnail: URL;
    author: {
      name: string;
    };
    tracks: Song[];
    trackCount: number;
  }

  export class Client {
    getPlaylist(url: URL): Promise<Playlist>;

    getSongInfo(url: URL): Promise<Song>;
  }

  export class Util {
    static validateURL(url: URL, type?: 'track' | 'playlist'): boolean;

    static fetchSongStreamURL(url: URL, clientID: string): Promise<string>;
  }

  export class StreamDownloader {
    static downloadProgressive(url: URL): Promise<IncomingMessage>;
  }
}
