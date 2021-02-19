import { prop } from '@typegoose/typegoose';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import type { Snowflake } from 'discord.js-light';

export default abstract class Entity extends TimeStamps {
  @prop()
  public id!: Snowflake;
}
