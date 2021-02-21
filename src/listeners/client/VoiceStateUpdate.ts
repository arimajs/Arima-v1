import { Listener, ListenerOptions } from '@arimajs/discord-akairo';
import type { VoiceState } from 'discord.js-light';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<ListenerOptions>('voiceStateUpdate', {
  event: 'voiceStateUpdate',
  emitter: 'client',
})
export default class VoiceStateUpdateListener extends Listener {
  public exec(oldState: VoiceState | null, newState: VoiceState | null): void {
    const {
      guild: { game },
      member,
    } = newState || oldState!;
    if (
      !game ||
      ![oldState?.channelID, newState?.channelID].includes(game.voice.id) ||
      !member
    )
      return;

    if (member.user.bot && !oldState)
      return void game.players.set(
        member.id,
        Object.assign(member, { start: Date.now() })
      );

    if (!member.user.bot && !newState) {
      if (member.id === game.host.id) return void game.end('host');
      return void game.players.set(
        member.id,
        Object.assign(game.players.get(member.id), {
          end: Date.now(),
        })
      );
    }

    const me = member.id === this.client.user!.id;

    if (
      (!newState && me) ||
      !game.voice.members.filter((member) => !member.user.bot).size
    )
      return void game.end('end');

    if (
      newState &&
      !newState.deaf &&
      me &&
      newState.guild.me!.hasPermission('DEAFEN_MEMBERS')
    )
      return void newState.setDeaf(true);
  }
}
