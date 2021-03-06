import { CommandOptions, Argument } from '@arimajs/discord-akairo';
import type {
  Message,
  TextChannel,
  Collection,
  Snowflake,
} from 'discord.js-light';
import { commaListsAnd } from 'common-tags';
import { Guild } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  channels: Collection<Snowflake, TextChannel> | 'all';
  restrict: boolean;
}

@ApplyOptions<CommandOptions>('set-channels', {
  aliases: ['restrict-channels', 'set-channels', 'whitelist-channels'],
  description: 'Set channels where you can use the bot',
  usage: '<list_of_channel_mentions [--restrict]>',
  examples: ['#bot-commands #bot-commands-2', '#not-a-bot-channel --restrict'],
  channel: 'guild',
  args: [
    {
      id: 'channels',
      type: Argument.union('channelMentions', ['all', 'reset']),
      match: 'rest',
      description:
        'The channels to restrict bot commands to, the channels where you cannot use the bot if using `--restrict`, or `all` if you want to remove restrictions',
      prompt: {
        start: 'What channels would you like to whitelist?',
        retry: "Make sure you're providing valid channels I have access to",
      },
    },
    {
      id: 'restrict',
      match: 'flag',
      flag: ['--restrict', '-r'],
      description:
        'Whether you want the given channels to serve as a blacklist instead of a whitelist',
    },
  ],
  userPermissions: ['MANAGE_GUILD'],
})
export default class SetChannelsCommand extends Command {
  public async run(
    message: Message,
    { channels, restrict }: Args
  ): Promise<void> {
    const [settings, guild] = await Promise.all([
      (await Guild.findOne({ id: message.guild!.id }).select(
        'allowedChannels'
      )) || new Guild({ id: message.guild!.id }),
      restrict ? this.client.guilds.fetch(message.guild!.id, false) : null,
    ]);

    if (channels === 'all') settings.allowedChannels = undefined;
    else {
      const ids = channels.map((c) => c.id);
      settings.allowedChannels = restrict
        ? (await guild!.channels.fetch(false))
            .filter(({ id }) => !ids.includes(id))
            .keyArray()
        : ids;
    }

    await settings.save();

    message.embed('Changes Saved', (embed) =>
      embed.setDescription(
        commaListsAnd`${restrict ? 'Black' : 'White'}listed channels set to ${
          typeof channels === 'string'
            ? 'all'
            : channels.map(({ id }) => `<#${id}>`)
        }`
      )
    );
  }
}
