import type { CommandOptions } from '@arimajs/discord-akairo';
import { DocumentType } from '@typegoose/typegoose';
import { commaListsAnd } from 'common-tags';
import { GuildMember, Message, Role } from 'discord.js-light';
import type { Playlist } from '../../lib/database/entities';
import { Logger, ApplyOptions } from '../../lib/utils';
import Command from '../../lib/structures/Command';

interface Args {
  playlist: DocumentType<Playlist>;
  collaborators: (GuildMember | Role)[];
}

@ApplyOptions<CommandOptions>('add-collaborators', {
  aliases: ['add-collaborators', 'collab'],
  description:
    "Add collaborators to a playlist so they can add/delete songs! They won't be able to delete the playlist or add other collaborators",
  usage: '<member | role> [member | role]...',
  examples: ['@Lioness100', '@Admin @Mod @DJ @Frank @Debbie'],
  args: [
    {
      id: 'playlist',
      type: 'custom-playlist',
      description: 'The custom playlist to add collaborators to',
      prompt: {
        start: 'What playlist would you like to modify?',
        retry: 'Please provide the name of a custom playlist',
      },
    },
    {
      id: 'collaborators',
      type: 'membersOrRoles',
      match: 'rest',
      description: 'The members/roles to add as collaborators',
      prompt: {
        start: 'Who would you like to add?',
        retry:
          'Please provide the mention or id of at least one valid member or role',
      },
    },
  ],
})
export default class AddCollaboratorsCommand extends Command {
  public async run(
    message: Message,
    { playlist, collaborators }: Args
  ): Promise<void> {
    if (playlist.id !== message.author.id)
      return message.error("You don't own this playlist");

    Logger.debug(typeof collaborators);
    const updatedCollaborators = [
      ...new Set(
        playlist.collaborators!.concat(
          collaborators.flatMap((collaborator) =>
            collaborator instanceof Role
              ? collaborator.members.map(({ id }) => id)
              : collaborator.id
          )
        )
      ),
    ];

    if (updatedCollaborators.length === playlist.collaborators!.length)
      return message.error('Everyone you mentioned is already collaborating');

    playlist.collaborators = updatedCollaborators;
    await playlist.save();

    const list = commaListsAnd`List of members collaborating: ${playlist.collaborators.map(
      (collaborator) => `<@${collaborator}>`
    )}`;

    message.embed(`Added collaborators to "${playlist.title}"`, (embed) =>
      embed
        .setThumbnail(playlist.thumbnail)
        .setColor(playlist.color as [number, number, number])
        .setDescription(
          list.length > 2048
            ? `There are now ${
                playlist.collaborators!.length
              } members collaborating`
            : list
        )
        .setFooter(
          'This is a beta feature! Please join our support server to report any bugs'
        )
    );
  }
}
