import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message, EmbedFieldData } from 'discord.js-light';
import { commaListsAnd } from 'common-tags';
import ApplyOptions from '../../lib/utils/ApplyOptions';
import { Command } from '../../lib/structures';

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
export default class HelpCommand extends Command {
  public async run(message: Message, { command }: Args): Promise<unknown> {
    const prefix = await this.client.util.prefix(message.guild);
    if (!command)
      return message.embed("Hi, I'm Arima!", (embed) =>
        embed
          .setDescription(
            `If you want a more detailed look at any command, you can use \`${prefix}commands <command>\` (also check out my documentation linked below)\n\nTo start a game, simply type \`${prefix}start <spotify, soundcloud, or youtube link>\``
          )
          .addFields([
            {
              name: '❔ Info',
              value: this.inline([
                'dashboard',
                'donate',
                'help',
                'info',
                'invite',
                'ping',
              ]).join(' '),
            },
            {
              name: '🎶 Music',
              value: this.inline([
                'add-song',
                'add-songs',
                'create-playlist',
                'delete-playlist',
                'delete-song',
                'playlist-info',
                'playlists',
                'skip',
                'song-info',
                'start',
                'stop',
              ]).join(' '),
            },
            {
              name: '🏆 Social',
              value: this.inline(['leaderboard', 'level', 'rank']).join(' '),
              inline: true,
            },
            {
              name: '🤖 Utility',
              value: this.inline([
                'prefix',
                'quiz-channel',
                'set-channels',
              ]).join(' '),
              inline: true,
            },
            {
              name: "Arima's Nexus",
              value: `[Invite Me](https://discord.com/api/oauth2/authorize?client_id=${
                this.client.user!.id
              }&permissions=3492928&scope=bot) • [Support Server](${
                process.env.SUPPORT_SERVER_INVITE
              }) • [Documentation Website](https://arima.fun) • [Github](https://github.com/arimajs/Arima) • [Patreon](https://patreon.com/ArimaBot)`,
            },
          ])
          .setThumbnail(this.client.user!.displayAvatarURL())
      );
    if (command.hidden) return message.error('This command is hidden 🙈');
    void message.embed(`Help for \`${prefix}${command.id}\``, (embed) =>
      embed
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
                value: `${command.ratelimit} every ${command.cooldown * 1000}s`,
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

  private inline(array: string[]) {
    return array.map((str) => `\`${str}\``);
  }

  private exists(value: unknown, ifTrue: string) {
    return value ? ifTrue : '';
  }
}
