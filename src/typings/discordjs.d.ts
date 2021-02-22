import type { EmojiResolvable, Snowflake } from 'discord.js-light';
import type { Game, EnhancedEmbed } from '../lib/structures';

declare module 'discord.js' {
  interface Guild {
    game?: Game;
  }

  interface Message {
    embed(title?: string): EnhancedEmbed;
    embed(
      title: string,
      send: true | ((embed: EnhancedEmbed) => EnhancedEmbed | void)
    ): Promise<Message>;
    embed(
      title?: string,
      send?: true | ((embed: EnhancedEmbed) => EnhancedEmbed | void)
    ): EnhancedEmbed | Promise<Message>;
    error(message: string, explanation?: string): void;
    reactAll(...emojis: EmojiResolvable[] | EmojiResolvable[][]): Promise<void>;
    poll(id: Snowflake): Promise<boolean>;
    attemptEdit(content: unknown): void;
  }
}
