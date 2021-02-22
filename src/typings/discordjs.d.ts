import type { EmojiResolvable, Snowflake } from 'discord.js-light';
import type { Game, EnhancedEmbed } from '../lib/structures';

declare module 'discord.js' {
  interface Guild {
    game?: Game;
  }

  interface Message {
    embed(
      title?: string,
      send: boolean | ((embed: EnhancedEmbed) => unknown) = false,
      useUtil = true
    ): EnhancedEmbed;
    error(message: string, explanation?: string, useUtil = true): void;
    reactAll(...emojis: EmojiResolvable[] | EmojiResolvable[][]): Promise<void>;
    poll(id: Snowflake): Promise<boolean>;
    attemptEdit(content: unknown): void;
  }
}
