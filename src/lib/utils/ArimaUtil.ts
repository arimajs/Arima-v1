import type { Guild, MessageEmbedOptions, TextChannel } from 'discord.js-light';
import { ClientUtil } from '@arimajs/discord-akairo';
import EnhancedEmbed from '../structures/EnhancedEmbed';
import { Guild as GuildDoc } from '../database';
import Logger from './Logger';
import { TextBasedChannel } from './types';

// fns that don't require the client will forward to a static duplicate so it
// can be used when the client object isn't accessible
export default class ArimaUtil extends ClientUtil {
  // if in dms return default prefix. Otherwise check for custom prefix and,
  // again, fallback to default prefix
  public async prefix(guild: Guild | null): Promise<string> {
    return guild
      ? (await GuildDoc.findOne({ id: guild.id }).select('prefix').lean())
          ?.prefix || process.env.PREFIX!
      : process.env.PREFIX!;
  }

  // I don't want to require `USE_EXTERNAL_EMOJIS` permission so just check
  // every time one is used and fallback to a unicode emoji
  public emoji<C extends string, U extends string>(
    custom: C,
    unicode: U,
    channel: TextBasedChannel
  ): C | U {
    return (channel as TextChannel)
      .permissionsFor?.(channel.client.user!)
      ?.has('USE_EXTERNAL_EMOJIS') ?? true
      ? custom
      : unicode;
  }

  public isBlue<C extends [number, number, number], S extends string>(
    color: C,
    ifSo: S
  ): C | S {
    return ArimaUtil.isBlue(color, ifSo);
  }

  public static isBlue<C extends [number, number, number], S extends string>(
    color: C,
    ifSo: S
  ): C | S {
    const [r, g, b] = color;
    // formula to turn rgb to decimal
    return (r << 16) + (g << 8) + b === 3447003 ? ifSo : color;
  }

  public embed(data?: MessageEmbedOptions): EnhancedEmbed {
    return ArimaUtil.embed(data);
  }

  public static embed(data?: MessageEmbedOptions): EnhancedEmbed {
    return new EnhancedEmbed(data);
  }

  public progressBar(value: number, max: number): string {
    return ArimaUtil.progressBar(value, max);
  }

  // Example: ▬▬▬▬▬▬----- 50%
  public static progressBar(value: number, max: number): string {
    const percentage = value / max;
    const progress = Math.round(12 * percentage);
    return `${'▬'.repeat(progress)}${'-'.repeat(12 - progress)} ${Math.round(
      percentage * 100
    )}%`;
  }

  public sample<T>(arr: T[]): T {
    return ArimaUtil.sample(arr);
  }

  public static sample<T>(arr: T[]): T {
    return arr[~~(Math.random() * arr.length)];
  }

  public ordinal(num: number): string {
    return ArimaUtil.ordinal(num);
  }

  // 1 = 1st, 2 = 2nd, 3 = 3rd, 4-x = xth
  public static ordinal(num: number): string {
    return `${num}${
      [null, 'st', 'nd', 'rd'][(num / 10) % 10 ^ 1 && num % 10] || 'th'
    }`;
  }

  public escapeRegex(str: string): string {
    return ArimaUtil.escapeRegex(str);
  }

  // prevent injection
  public static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public tap<T>(value: T): T {
    return ArimaUtil.tap(value);
  }

  // useful for debugging
  public static tap<T>(value: T): T {
    Logger.debug(value);
    return value;
  }

  public shuffle<T extends unknown[]>(arr: T): T {
    return ArimaUtil.shuffle(arr);
  }

  // not the best algorithm but it doesn't have to be and es6 one-liners are
  // pleasing to the eye
  public static shuffle<T extends unknown[]>(arr: T): T {
    return arr.sort(() => 0.5 - Math.random());
  }

  public chunk<T>(arr: T[], size: number): T[][] {
    return ArimaUtil.chunk(arr, size);
  }

  // separate arrays to chunks to different sizes
  // chunk([1, 2, 3, 4, 5, 6, 7, 8, 9], 3) => [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  public static chunk<T>(arr: T[], size: number): T[][] {
    return [
      ...(Array(Math.ceil(arr.length / size)) as undefined[]),
    ].map((_, i) => arr.slice(size * i, size + size * i));
  }

  public upper(str: string): string {
    return ArimaUtil.upper(str);
  }

  public static upper(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
  }
}
