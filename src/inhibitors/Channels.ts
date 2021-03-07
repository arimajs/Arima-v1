import { Command, Inhibitor, InhibitorOptions } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import { commaListsAnd } from 'common-tags';
import { Guild } from '../lib/database';
import ApplyOptions from '../lib/utils/ApplyOptions';

@ApplyOptions<InhibitorOptions>('channels', { reason: 'channel' })
export default class ChannelsInhibitor extends Inhibitor {
  public async exec(message: Message, command: Command): Promise<boolean> {
    if (!message.guild || message.member!.hasPermission('MANAGE_GUILD'))
      return false;
    const guild = await Guild.findOne({ id: message.guild.id })
      .select('quizChannel allowedChannels')
      .lean();
    if (!guild) return false;
    if (
      guild.allowedChannels?.length &&
      guild.quizChannel !== message.channel.id &&
      !guild.allowedChannels.includes(message.channel.id)
    ) {
      message.error(
        `You can't do that here!`,
        commaListsAnd`You can only use my commands in ${guild.allowedChannels.map(
          (c) => `<#${c}>`
        )}`
      );
      return true;
    }

    if (
      command.game !== undefined &&
      guild.quizChannel &&
      guild.quizChannel !== message.channel.id
    ) {
      message.error(
        `You can't do that here!`,
        `You can only use my game-related commands in <#${guild.quizChannel}>`
      );
      return true;
    }

    return false;
  }
}
