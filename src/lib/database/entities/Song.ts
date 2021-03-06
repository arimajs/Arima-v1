import { prop } from '@typegoose/typegoose';
import ytdl from 'discord-ytdl-core';
import ytsr, { Video } from 'youtube-sr';
import { Util, StreamDownloader, Store } from 'soundcloud-scraper';
import { getPreview } from 'spotify-url-info';
import { getColor } from 'colorthief';
import { WhatIsIt } from '@typegoose/typegoose/lib/internal/constants';
import ArimaClient from '../../client/ArimaClient';
import { spotifySongRegex } from '../../utils/Constants';
import type { URL } from '../../utils/types';

export default class Song {
  @prop()
  public duration!: number;

  @prop()
  public title!: string;

  @prop()
  public thumbnail!: URL;

  @prop()
  public author!: string;

  @prop()
  public url!: URL;

  @prop({ type: () => [Number] }, WhatIsIt.ARRAY)
  public color!: [number, number, number] | Promise<[number, number, number]>;

  @prop()
  public progressive_url?: URL;

  public static async stream(
    song: Song
  ): Promise<ReturnType<typeof ytdl['arbitraryStream']>> {
    return song.progressive_url
      ? ytdl.arbitraryStream(
          await StreamDownloader.downloadProgressive(
            await Util.fetchSongStreamURL(
              song.progressive_url,
              Store.get('SOUNDCLOUD_API_KEY')!
            )
          ),
          {
            opusEncoded: true,
            seek: ~~(Math.random() * (song.duration / 1000 - 30)),
          }
        )
      : ytdl(song.url, {
          requestOptions: {
            headers: {
              cookie: process.env.YOUTUBE_COOKIE,
              'x-youtube-identity-token': process.env.YOUTUBE_ID_TOKEN,
            },
          },
          quality: 'highestaudio',
          filter: 'audioonly',
          opusEncoded: true,
          seek: ~~(Math.random() * (song.duration / 1000 - 30)),
          highWaterMark: 1 << 24,
        });
  }

  public static async resolveSong(
    query: string | URL,
    client: ArimaClient
  ): Promise<Song | Video[] | 'LIVE_VIDEO' | 'NO_RESULTS'> {
    if (ytsr.validate(query, 'VIDEO') || ytsr.validate(query, 'VIDEO_ID')) {
      const { videoDetails: video } = await ytdl.getBasicInfo(query, {
        requestOptions: {
          headers: {
            cookie: process.env.COOKIE,
            'x-youtube-identity-token': process.env.YOUTUBE_ID_TOKEN,
          },
        },
      });
      if (video.isLiveContent) return 'LIVE_VIDEO';

      const thumbnail = video.thumbnails[video.thumbnails.length - 1].url;
      return {
        duration: +video.lengthSeconds * 1000,
        title: video.title,
        thumbnail,
        author: video.author.name,
        url: video.video_url,
        color: getColor(thumbnail).catch(
          () => [52, 152, 219] as [number, number, number]
        ),
      };
    }

    if (Util.validateURL(query, 'track')) {
      const song = await client.soundcloud.getSongInfo(query).catch(() => {});
      if (!song) return 'NO_RESULTS';
      return {
        duration: song.duration,
        title: song.title,
        thumbnail: song.thumbnail,
        author: song.author.name,
        url: song.url,
        progressive_url: song.streams.progressive,
        color: getColor(song.thumbnail).catch(
          () => [52, 152, 219] as [number, number, number]
        ),
      };
    }

    if (spotifySongRegex.test(query)) {
      const song = await getPreview(query).catch(() => {});

      if (!song) return 'NO_RESULTS';

      const video = await ytsr.searchOne(`${song.artist} - ${song.title}`);
      if (!video) return 'NO_RESULTS';

      const thumbnail = video.thumbnail!.url!;
      return {
        duration: video.duration,
        title: song.title,
        thumbnail,
        author: song.artist,
        url: video.url,
        color: getColor(thumbnail).catch(
          () => [52, 152, 219] as [number, number, number]
        ),
      };
    }

    const video = await ((ytsr.search(query, {
      type: 'video',
      limit: 5,
    }) as unknown) as Promise<Video[]>).catch(() => null);
    return video?.length ? video : 'NO_RESULTS';
  }

  public static mapYoutubeVideo(video: Video): Song {
    const thumbnail = video.thumbnail!.url!;
    return {
      duration: video.duration,
      title: video.title!,
      thumbnail,
      author: video.channel!.name!,
      url: video.url,
      color: getColor(thumbnail).catch(
        () => [52, 152, 219] as [number, number, number]
      ),
    };
  }
}
