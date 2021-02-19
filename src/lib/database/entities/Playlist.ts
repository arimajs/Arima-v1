import { prop, DocumentType } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import type { Snowflake } from 'discord.js-light';
import { Util } from 'soundcloud-scraper';
import ytsr, { Playlist as YoutubePlaylist } from 'youtube-sr';
import { getData, Playlist as SpotifyPlaylist, Album } from 'spotify-url-info';
import { getColor } from 'colorthief';
import { WhatIsIt } from '@typegoose/typegoose/lib/internal/constants';
import ArimaClient from '../../client/ArimaClient';
import { spotifyPlaylistRegex, spotifyAlbumRegex } from '../../utils/Constants';
import type { URL } from '../../utils/types';
import { Playlist as PlaylistDoc } from '..';
import Song from './Song';

export default class Playlist extends TimeStamps {
  @prop()
  id?: Snowflake;

  @prop()
  title!: string;

  @prop()
  author!: string;

  url?: URL;

  @prop()
  thumbnail!: URL;

  @prop({ type: Song, default: [], _id: false })
  tracks!: Song[];

  @prop({ default: 0 })
  track_count!: number;

  @prop({ type: () => [Number] }, WhatIsIt.ARRAY)
  color!: [number, number, number] | Promise<[number, number, number]>;

  public static async resolvePlaylist(
    query: URL | string,
    client: ArimaClient,
    id?: Snowflake,
    custom?: boolean,
    lean?: boolean
  ): Promise<
    | DocumentType<Playlist>
    | Playlist
    | YoutubePlaylist[]
    | 'NO_RESULTS'
    | 'NO_TRACKS'
  > {
    if (!custom && spotifyPlaylistRegex.test(query)) {
      const playlist = (await getData(
        query
      ).catch(() => {})) as SpotifyPlaylist | void;
      if (!playlist) return 'NO_RESULTS';
      if (!playlist.tracks.items.length) return 'NO_TRACKS';

      const thumbnail = playlist.images[0].url;

      return {
        title: playlist.name,
        author: playlist.owner.display_name,
        url: playlist.external_urls.spotify,
        thumbnail,
        tracks: playlist.tracks.items.map(({ track }) => ({
          title: track.name,
          thumbnail:
            track.album?.images[0].url ??
            'https://www.freepnglogos.com/uploads/spotify-logo-png/file-spotify-logo-png-4.png',
          author: track.artists[0].name,
          duration: track.duration_ms,
          url: track.external_urls.spotify,
          color: getColor(
            track.album?.images[0].url ??
              'https://www.freepnglogos.com/uploads/spotify-logo-png/file-spotify-logo-png-4.png'
          ).catch(() => [52, 152, 219] as [number, number, number]),
        })),
        track_count: playlist.tracks.items.length,
        color: getColor(thumbnail).catch(() => [52, 152, 219]),
      };
    }

    if (
      !custom &&
      (ytsr.validate(query, 'PLAYLIST') || ytsr.validate(query, 'PLAYLIST_ID'))
    ) {
      const playlist = await ytsr.getPlaylist(query);
      if (!playlist) return 'NO_RESULTS';
      if (!playlist.videos!.length) return 'NO_TRACKS';

      return this.mapYoutubePlaylist(playlist);
    }

    if (!custom && Util.validateURL(query, 'playlist')) {
      const playlist = await client.soundcloud
        .getPlaylist(query)
        .catch(() => {});
      if (!playlist) return 'NO_RESULTS';
      if (!playlist.trackCount) return 'NO_TRACKS';
      return {
        title: playlist.title,
        thumbnail: playlist.thumbnail,
        url: playlist.url,
        tracks: playlist.tracks.map((song) => ({
          duration: song.duration,
          title: song.title,
          thumbnail:
            song.thumbnail || 'https://soundcloud.com/pwa-icon-192.png',
          author: song.author.name || playlist.author.name,
          url: song.url,
          progressive_url: song.streams.progressive,
          color: getColor(song.thumbnail).catch(() => [52, 152, 219]),
        })),
        author: playlist.author.name,
        track_count: playlist.trackCount,
        color: getColor(playlist.thumbnail).catch(() => [52, 152, 219]),
      };
    }

    if (!custom && spotifyAlbumRegex.test(query)) {
      const album = (await getData(query).catch(() => {})) as Album | void;
      if (!album) return 'NO_RESULTS';
      if (!album.tracks.items.length) return 'NO_TRACKS';

      const thumbnail = album.images[0].url;

      return {
        title: album.name,
        author: album.artists[0].name,
        url: album.external_urls.spotify,
        thumbnail,
        tracks: album.tracks.items.map((track) => ({
          duration: track.duration_ms,
          title: track.name,
          thumbnail,
          author: track.artists[0].name,
          url: track.external_urls.spotify,
          color: getColor(thumbnail).catch(
            () => [52, 152, 219] as [number, number, number]
          ),
        })),
        track_count: album.tracks.items.length,
        color: getColor(thumbnail).catch(() => [52, 152, 219]),
      };
    }

    if (id) {
      const playlist = await PlaylistDoc.findOne({
        id,
        title: {
          $regex: new RegExp(`^${client.util.escapeRegex(query)}$`, 'i'),
        },
      })[lean ? 'lean' : 'exec']();

      if (playlist) return playlist;
      if (custom) return 'NO_RESULTS';
    }

    let playlists = await ((ytsr.search(query, {
      type: 'playlist',
    }) as unknown) as Promise<YoutubePlaylist[]>).catch(() => null);

    if (!playlists) return 'NO_RESULTS';
    playlists = playlists.filter((playlist) => playlist.videos!.length);
    return playlists.length ? playlists.slice(0, 5) : 'NO_RESULTS';
  }

  public static mapYoutubePlaylist(playlist: YoutubePlaylist): Playlist {
    const thumbnail = playlist.videos![0].thumbnail!.url!;
    return {
      title: playlist.title!,
      thumbnail,
      url: playlist.url!,
      tracks: playlist.videos!.map((song) => ({
        duration: song.duration,
        title: song.title!,
        thumbnail: song.thumbnail!.url!,
        author: song.channel!.name!,
        url: song.url,
        color: getColor(song.thumbnail!.url!).catch(() => [52, 152, 219]),
      })),
      author: playlist.channel!.name!,
      track_count: playlist.videos!.length,
      color: getColor(thumbnail).catch(() => [52, 152, 219]),
    };
  }
}
