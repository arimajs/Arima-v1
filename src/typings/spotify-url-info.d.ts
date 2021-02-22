declare module 'spotify-url-info' {
  await import('../lib/utils/types');

  import type { URL } from '../lib/utils/types';

  interface ExternalURLs {
    spotify: URL;
  }

  export interface Song {
    album?: SongCollection;
    artists: { name: string }[];
    external_urls: ExternalURLs;
    duration_ms: number;
    name: string;
  }

  export interface SongPreview {
    artist: string;
    title: string;
    image: URL;
  }

  interface SongCollection {
    images: { url: URL }[];
    external_urls: ExternalURLs;
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

  export function getData(url: URL): Promise<Song | Playlist | Album>;

  export function getPreview(url: URL): Promise<SongPreview>;
}
