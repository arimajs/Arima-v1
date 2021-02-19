import { Collection, Snowflake } from 'discord.js-light';
import ArimaUtil from '../../utils/ArimaUtil';

export default class Leaderboard extends Collection<Snowflake, number> {
  public get leader(): [Snowflake, number] | undefined {
    const sorted = this.sort((a, b) => b - a);
    return sorted.size ? [sorted.firstKey()!, sorted.first()!] : undefined;
  }

  public inc(key: Snowflake, value = 1): number {
    this.set(key, (this.get(key) || 0) + value);
    return this.get(key)!;
  }

  public compute(limit = 10): Snowflake {
    return (
      [...this.sort((a, b) => b - a).entries()]
        .slice(0, limit)
        .map(
          ([user, points], idx) =>
            `${ArimaUtil.ordinal(
              idx + 1
            )} Place • <@${user}> • ${points} point${points === 1 ? '' : 's'}`
        )
        .join('\n') || "Nobody's on the leaderboard yet!"
    );
  }
}
