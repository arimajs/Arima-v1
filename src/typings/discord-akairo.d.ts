import type {
  CommandHandler,
  ListenerHandler,
  InhibitorHandler,
  ArgumentOptions,
} from '@arimajs/discord-akairo';
import type {
  Collection,
  Snowflake,
  Guild,
  EmbedFieldData,
} from 'discord.js-light';
import type Database from '../lib/database/Database';
import type PromClient from '../lib/utils/PromClient';
import type { TextBasedChannel } from '../lib/utils/types';
import type { Player, Game, EnhancedEmbed } from '../lib/structures';

declare module '@arimajs/discord-akairo' {
  interface AkairoClient {
    db: Database;
    player: Player;
    prom: PromClient;
    commandHandler: CommandHandler;
    listenerHandler: ListenerHandler;
    inhibitorHandler: InhibitorHandler;
    games: Collection<Snowflake, Game>;
  }

  interface Command {
    game?: boolean;
    examples?: string[];
    hidden?: boolean;
    usage?: string;
    argDescriptions: ArgumentOptions[];
  }

  interface CommandOptions {
    game?: boolean;
    argDescriptions?: ArgumentOptions[];
    examples?: string[];
    hidden?: boolean;
    usage?: string;
  }

  interface ClientUtil {
    emoji<C extends string, U extends string>(
      custom: C,
      unicode: U,
      channel: TextBasedChannel
    ): C | U;
    prefix(guild: Guild | null): Promise<string>;
    isBlue<C extends [number, number, number], S extends string>(
      color: C,
      ifSo: S
    ): C | S;
    getMemberInfo(member: GuildMember): EmbedFieldData[];
    embed(data?: MessageEmbedOptions): EnhancedEmbed;
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
