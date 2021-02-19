import { getModelForClass } from '@typegoose/typegoose';
import {
  Playlist as PlaylistSchema,
  Guild as GuildSchema,
  Song as SongSchema,
  User as UserSchema,
} from './entities';

import DB from './Database';

export const Database = DB;

export const Playlist = getModelForClass(PlaylistSchema);
export const Guild = getModelForClass(GuildSchema);
export const Song = getModelForClass(SongSchema);
export const User = getModelForClass(UserSchema);
