import { prop, DocumentType } from '@typegoose/typegoose';
import ArimaClient from '../../client/ArimaClient';
import type { TextBasedChannel } from '../../utils/types';
import Entity from './Entity';

const ranks = {
  beginner: 0,
  experienced: 10,
  master: 20,
  divine: 30,
  legendary: 40,
};

const emojis = {
  beginner: '<a:beginner:808115043598204928>',
  experienced: '<a:experienced:808115164347760671>',
  master: '<a:master:808115340445351997>',
  divine: '<a:divine:808115534147092480>',
  legendary: '<a:legendary:808115638240411689>',
};

// TODO "gamesPlayed" "hasVoted" props on User (no more than 3 games w/o voting) maybe use BLWebhooks? Maybe don't have to vote if patron/booster?
export default class User extends Entity {
  @prop({ default: 0 })
  matchesWon!: number;

  @prop({ default: 0 })
  matchesPlayed!: number;

  @prop({ default: 0 })
  songsGuessed!: number;

  @prop({ type: () => String, default: 'beginner' })
  rank!: keyof typeof ranks;

  @prop({ default: 0 })
  level!: number;

  @prop({ default: 0 })
  xp!: number;

  @prop({ default: false })
  premium!: boolean;

  public static getEmoji<T extends keyof typeof ranks>(
    rank: T,
    channel: TextBasedChannel
  ): typeof emojis[T] | ':notes:' {
    return (channel.client as ArimaClient).util.emoji(
      emojis[rank],
      ':notes:',
      channel
    );
  }

  public static levelFor(xp: number): number {
    return Math.floor(
      xp > 62500 ? 25 + (xp - 62500) / 5000 : ~~(0.1 * Math.sqrt(xp))
    );
  }

  public static xpFor(level: number): number {
    return Math.floor(
      level > 25 ? 5000 * (level - 24) + 57600 : level ** 2 * 100
    );
  }

  public static matchesFor<T extends keyof typeof ranks>(
    rank: T
  ): typeof ranks[T] {
    return ranks[rank];
  }

  public static rankFor(matchesWon: number): keyof typeof ranks {
    return (
      (Object.keys(ranks).find(
        (rank) =>
          (ranks as Record<string, number>)[rank] ===
          Math.floor(matchesWon / 10) * 10
      ) as keyof typeof ranks) || 'legendary'
    );
  }

  public appendXp(this: DocumentType<User>, xp: number): boolean {
    this.xp += xp;
    this.level = User.levelFor(this.xp);
    return User.levelFor(this.xp - xp) < this.level;
  }

  public appendMatch(
    this: DocumentType<User>,
    songsGuessed: number,
    won: boolean
  ): boolean {
    this.songsGuessed += songsGuessed;
    this.matchesPlayed++;

    if (won) {
      this.matchesWon++;
      this.rank = User.rankFor(this.matchesWon);
    }
    return !!won && this.rank !== User.rankFor(this.matchesWon - 1);
  }
}
