import { Command, Inhibitor, InhibitorOptions } from '@arimajs/discord-akairo';
import { Message } from 'discord.js-light';
import ApplyOptions from '../lib/utils/ApplyOptions';

@ApplyOptions<InhibitorOptions>('game', {
  reason: 'game',
})
export default class GameInhibitor extends Inhibitor {
  public exec(message: Message, command: Command): boolean {
    if (command.game === true) {
      if (!message.guild!.game) {
        message.error('You can only use this command if a game is in session');
        return true;
      }
      if (message.guild!.game.text.id !== message.channel.id) {
        message.error(
          'Please only use game-related commands in the channel where the game is being played'
        );
        return true;
      }
    } else if (command.game === false && message.guild!.game) {
      message.error("There's already a game in session");
      return true;
    }

    return false;
  }
}
