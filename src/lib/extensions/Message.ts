import {
  Structures,
  EmojiResolvable,
  MessageReaction,
  Message,
  User,
  Snowflake,
} from 'discord.js-light';
import EnhancedEmbed from '../structures/EnhancedEmbed';

export default Structures.extend(
  'Message',
  (Message) =>
    class extends Message {
      public embed(title?: string): EnhancedEmbed;
      public embed(
        title: string,
        send: true | ((embed: EnhancedEmbed) => EnhancedEmbed | void)
      ): Promise<Message>;
      public embed(
        title?: string,
        send?: true | ((embed: EnhancedEmbed) => EnhancedEmbed | void)
      ): EnhancedEmbed | Promise<Message> {
        const embed = new EnhancedEmbed()
          .personalize(this.author)
          .setColor('BLUE');

        if (title) embed.setTitle(title);

        if (send) {
          if (typeof send === 'function') send(embed);
          return new Promise((resolve) => {
            void this.channel.send(embed).then(resolve);
          });
        }

        return embed;
      }

      public error(message: string, explanation?: string): void {
        void this.embed(`:x: ${message}`, (embed) => {
          embed.setColor('RED');
          if (explanation) embed.setDescription(explanation);
        });
      }

      public async reactAll(
        ...emojis: EmojiResolvable[] | EmojiResolvable[][]
      ) {
        for (const emoji of emojis.flat()) {
          if (this.deleted) break;
          try {
            await this.react(emoji);
          } catch (err) {
            break;
          }
        }
      }

      public async poll(id: Snowflake) {
        const emojis = ['✅', '❌'];
        await this.reactAll(emojis);
        const reactions = await this.awaitReactions(
          (reaction: MessageReaction, user: User) =>
            emojis.includes(reaction.emoji.name) && user.id === id,
          { max: 1, time: 3e4 }
        );
        await this.reactions.removeAll().catch(() => {});
        return !!(reactions.first()?.emoji.name === emojis[0]);
      }

      public attemptEdit(content: EnhancedEmbed) {
        return void (this.deleted
          ? this.channel.send(content)
          : this.edit(content));
      }
    }
);
