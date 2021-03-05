import { Structures } from 'discord.js-light';
import Game from '../structures/quiz/Game';

Structures.extend(
  'Guild',
  (Guild) =>
    class extends Guild {
      game?: Game;
    }
); // TODO this isn't needed
