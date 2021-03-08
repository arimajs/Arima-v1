import { Listener, ListenerOptions } from '@arimajs/discord-akairo';
import type { VoiceState } from 'discord.js-light';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<ListenerOptions>('voiceStateUpdate', {
  event: 'voiceStateUpdate',
  emitter: 'client',
})
export default class VoiceStateUpdateListener extends Listener {
  public exec(
    oldState: VoiceState | null,
    newState: VoiceState | null
  ): unknown {
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

    // if someone joins a game, set this date as their entry time
    if (!member.user.bot && !oldState)
      return game.players.set(
        member.id,
        Object.assign(member, { start: Date.now() })
      );

    // reversely, if someone leaves the game, set this date as their departure
    // time
    if (!member.user.bot && !newState) {
      // if the host leaves, end the game
      if (member.id === game.host.id) return game.end('host');
      if (game.players.has(member.id))
        return game.players.set(
          member.id,
          Object.assign(game.players.get(member.id), {
            end: Date.now(),
          })
        );
    }

    const me = member.id === this.client.user!.id;

    // if Arima was kicked or left alone in the voice channel, end the game
    if (
      (!newState && me) ||
      !game.voice.members.filter((member) => !member.user.bot).size
    )
      return game.end('end');

    // if Arima was undeafened, self deafen
    if (newState && !newState.deaf && me) return newState.setSelfDeaf(true);
  }
}
