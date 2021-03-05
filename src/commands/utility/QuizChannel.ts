import { CommandOptions, Argument } from '@arimajs/discord-akairo';
import type { Message, TextChannel } from 'discord.js-light';
import { Guild } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  channel: TextChannel | 'all';
  restrict: boolean;
}

@ApplyOptions<CommandOptions>('quiz-channel', {
  aliases: ['quiz-channel', 'game-channel'],
  description: 'Set channels where you can use game-related commands',
  usage: '<channel>',
  examples: ['#music-quiz'],
  channel: 'guild',
  args: [
    {
      id: 'channel',
      type: Argument.union('channelMention', ['all', 'reset']),
      match: 'rest',
      description:
        'The channels to restrict game-related commands to, or `all` if you want to fallback to the normal restricted channels',
      prompt: {
        start: 'What channel would you like to whitelist for game commands?',
        retry: "Make sure you're providing a valid channel I have access to",
      },
    },
  ],
  userPermissions: ['MANAGE_GUILD'],
})
export default class RestrictChannelsCommand extends Command {
  public async run(message: Message, { channel }: Args): Promise<void> {
    const settings =
      (await Guild.findOne({ id: message.guild!.id }).select('quizChannel')) ||
      new Guild({ id: message.guild!.id });

    settings.quizChannel = channel === 'all' ? undefined : channel.id;
    await settings.save();

    message.embed('Changes Saved', (embed) =>
      embed.setDescription(`Quiz channel set to ${channel}`)
    );
  }
}
