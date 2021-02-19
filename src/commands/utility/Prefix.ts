import type { CommandOptions } from 'discord-akairo';
import type { Message } from 'discord.js-light';
import { Guild } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  prefix?: string;
}

@ApplyOptions<CommandOptions>('prefix', {
  aliases: ['prefix', 'p'],
  description: "View/change Arima's prefix",
  usage: '[new_prefix]',
  examples: ['!!', 'arima|'],
  args: [
    {
      id: 'prefix',
      match: 'rest',
      description: 'The new prefix, if any',
      prompt: { optional: true },
    },
  ],
})
export default class PrefixCommand extends Command {
  public async run(message: Message, { prefix }: Args): Promise<unknown> {
    if (!message.guild)
      return message.embed(`My prefix is \`${process.env.PREFIX}\``, (embed) =>
        (prefix
          ? embed
              .setColor('RED')
              .setFooter("You can't change my prefix in DMs!")
          : embed
        ).setDescription(`I also respond to ${this.client.user}`)
      );

    let settings = await Guild.findOne({
      id: message.guild.id,
    }).select('prefix');

    if (!prefix)
      return message.embed(
        `My current prefix is \`${settings?.prefix || process.env.PREFIX}\``,
        (embed) => embed.setDescription(`I also respond to ${this.client.user}`)
      );

    if (!message.member!.hasPermission('MANAGE_GUILD'))
      return message.error(
        'You must have the `MANAGE_GUILD` permission to change the prefix'
      );

    if (prefix.length > 100)
      return message.error(
        'Please keep the prefix length to under 100 characters'
      );

    settings ||= new Guild({ id: message.guild.id });
    settings.prefix = prefix;

    try {
      await settings.save();
      message.embed(`Success!`, (embed) =>
        embed.setDescription(`My prefix has been changed to \`${prefix}\``)
      );
    } catch (e) {
      message.error(`There was an issue saving your prefix`);
    }
  }
}
