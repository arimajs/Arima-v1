import type { Snowflake } from 'discord.js-light';
import Leaderboard from './Leaderboard';

export default class StreakCounter extends Leaderboard {
  public addStreak(key: Snowflake): this {
    if (!this.has(key)) this.set(key, 0);
    this.filter((_, curr) => curr !== key).forEach((points, user) =>
      this.inc(user, -points)
    );
    this.inc(key);
    return this;
  }

  public removeAll(): void {
    this.forEach((points, user) => this.inc(user, -points));
  }
}
