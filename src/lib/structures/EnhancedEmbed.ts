import {
  MessageEmbed,
  User,
  GuildMember,
  Message,
  MessageReaction,
} from 'discord.js-light';

export default class EnhancedEmbed extends MessageEmbed {
  public personalize(person: User | GuildMember, colorize = true): this {
    const user = person instanceof GuildMember ? person.user : person;
    this.setAuthor(user.tag, user.displayAvatarURL());
    if (person instanceof GuildMember && colorize)
      this.setColor(person.displayColor || 'BLUE');
    return this;
  }

  public addBlankField(): this {
    return this.addField('\u200b', '\u200b');
  }

  static async paginate(
    message: Message,
    pages: EnhancedEmbed[],
    ids = [message.author.id]
  ): Promise<Message> {
    let page = 0;
    const footer = () => `Showing Page ${page + 1} / ${pages.length}`;
    const current = await message.channel.send(pages[page].setFooter(footer()));

    if (!pages[1]) return message;

    const emojis = ['⏪', '⏩'];
    await current.reactAll('⏪', '⏩');

    const collector = current.createReactionCollector(
      (reaction: MessageReaction, author: User) =>
        emojis.includes(reaction.emoji.name) && ids.includes(author.id),
      { dispose: true }
    );

    const paginate = (reaction: MessageReaction) => {
      console.log('test');
      try {
        if (reaction.emoji.name === emojis[0])
          page = page ? page - 1 : pages.length - 1;
        else page = page + 1 < pages.length ? page + 1 : 0;

        void current.edit(new EnhancedEmbed(pages[page]).setFooter(footer()));
      } catch (err) {
        void current.edit(
          message.embed("You're changing pages too fast!").setColor('RED')
        );
      }
    };

    collector.on('collect', paginate).on('remove', paginate);

    return current;
  }
}
