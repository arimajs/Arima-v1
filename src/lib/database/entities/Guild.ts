import { prop } from '@typegoose/typegoose';
import type { Snowflake } from 'discord.js-light';
import Entity from './Entity';

export default class Guild extends Entity {
  @prop()
  prefix?: string;

  @prop()
  quizChannel?: Snowflake;

  @prop({ type: () => [String] })
  allowedChannels?: Snowflake[];
}
