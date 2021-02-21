import type { Guild, MessageEmbedOptions, TextChannel } from 'discord.js-light';
import { ClientUtil } from '@arimajs/discord-akairo';
import EnhancedEmbed from '../structures/EnhancedEmbed';
import { Guild as GuildDoc } from '../database';
import Logger from './Logger';
import { TextBasedChannel } from './types';

export default class ArimaUtil extends ClientUtil {
  public async prefix(guild: Guild | null): Promise<string> {
    return guild
      ? (await GuildDoc.findOne({ id: guild.id }).select('prefix').lean())
          ?.prefix || process.env.PREFIX!
      : process.env.PREFIX!;
  }

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

  public static ordinal(num: number): string {
    return `${num}${
      [null, 'st', 'nd', 'rd'][(num / 10) % 10 ^ 1 && num % 10] || 'th'
    }`;
  }

  public escapeRegex(str: string): string {
    return ArimaUtil.escapeRegex(str);
  }

  public static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public tap<T>(value: T): T {
    return ArimaUtil.tap(value);
  }

  public static tap<T>(value: T): T {
    Logger.debug(value);
    return value;
  }

  public shuffle<T extends unknown[]>(arr: T): T {
    return ArimaUtil.shuffle(arr);
  }

  public static shuffle<T extends unknown[]>(arr: T): T {
    return arr.sort(() => 0.5 - Math.random());
  }

  public chunk<T>(arr: T[], size: number): T[][] {
    return ArimaUtil.chunk(arr, size);
  }

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
