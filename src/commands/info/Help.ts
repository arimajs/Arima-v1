import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message, EmbedFieldData } from 'discord.js-light';
import { commaListsAnd } from 'common-tags';
import ApplyOptions from '../../lib/utils/ApplyOptions';
import { EnhancedEmbed, Command } from '../../lib/structures';

interface Args {
  command?: Command;
}

@ApplyOptions<CommandOptions>('help', {
  aliases: ['commands', 'help', '?', 'docs'],
  description: 'View all of my commands',
  usage: '[command]',
  args: [
    {
      id: 'command',
      type: 'commandAlias',
      description: 'The specific command to view, if any',
    },
  ],
})
export default class CommandsCommand extends Command {
  public async run(message: Message, { command }: Args): Promise<unknown> {
    const prefix = await this.client.util.prefix(message.guild);
    if (!command) {
      const sent = await message.author.send(
        message
          .embed('All Arima Commands')
          .setDescription(
            `If you want a more detailed look at any command, you can use \`${prefix}commands <command>\` or \`${prefix}<command> --help\`\n\nRemember that everything inside \`<>\` is required, everything inside \`[]\` is optional, and \`|\` means "or". Don't include these symbols in the actual command`
          )
      );
      await EnhancedEmbed.paginate(
        sent,
        [
          message.embed('My Commands'),
          ...this.handler.categories
            .filter((category) => category.some((command) => !command.hidden))
            .map((category) =>
              message
                .embed(`${this.client.util.upper(category.id)} Commands`)
                .setColor('RANDOM')
                .addFields(
                  category
                    .filter((command) => !command.hidden)
                    .map((command) => ({
                      name: this.client.util.upper(command.id),
                      value: `\`${prefix}${command.id} ${
                        command.usage || ''
                      }\`\n${command.description}`,
                      inline: true,
                    }))
                )
                .setFooter('The arrows will deactivate after 30 seconds')
            ),
        ],
        [message.author.id]
      );
    } else {
      if (command.hidden) return message.error('This command is hidden 🙈');
      await message.author.send(
        message
          .embed(`Help for \`${prefix}${command.id}\``)
          .addFields(
            [
              {
                name: 'Category',
                value: this.client.util.upper(command.categoryID),
              },
              command.aliases.length > 1 && {
                name: 'Aliases',
                value: commaListsAnd`${this.inline(command.aliases)}`,
              },
              Array.isArray(command.argDescriptions) && {
                name: `Arguments: ${command.argDescriptions.length}`,
                value: command.argDescriptions
                  .map(
                    (arg) =>
                      `> Descriptor: \`${arg.id}\`\n${this.exists(
                        arg.type,
                        `> Type: ${
                          typeof arg.type === 'string' ? arg.type : 'custom'
                        }\n`
                      )}${this.exists(
                        !['function', 'undefined'].includes(typeof arg.default),
                        `> Default: ${arg.default}\n`
                      )}${this.exists(
                        arg.flag,
                        commaListsAnd`> Flag Alias(es): ${this.inline(
                          [arg.flag!].flat()
                        )}\n`
                      )}${this.exists(
                        arg.description,
                        `> Description: ${arg.description}\n`
                      )}`
                  )
                  .join('\n'),
              },
              {
                name: 'Usage',
                value: `\`\`\`\n!${command.id} ${command.usage || ''}\n\`\`\``,
              },
              command.examples && {
                name: 'Example(s)',
                value: command.examples
                  .map((example) => `\`\`\`\n!${command.id} ${example}\n\`\`\``)
                  .join('\n'),
              },
              command.cooldown &&
                command.cooldown !== 1000 && {
                  name: 'Cooldown',
                  value: `${command.ratelimit} every ${
                    command.cooldown * 1000
                  }s`,
                },
              Array.isArray(command.userPermissions) && {
                name: 'Permission(s) Required',
                value: commaListsAnd`${this.inline(
                  command.userPermissions as string[]
                )}`,
              },
            ].filter(Boolean) as EmbedFieldData[]
          )
          .setDescription(command.description || 'No description provided')
      );
    }
    void message.react('👍');
  }

  private inline(array: string[]) {
    return array.map((str) => `\`${str}\``);
  }

  private exists(value: unknown, ifTrue: string) {
    return value ? ifTrue : '';
  }
}
