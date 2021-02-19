import type { TextChannel, DMChannel, NewsChannel } from 'discord.js-light';

export type URL = string;
export type TextBasedChannel = TextChannel | DMChannel | NewsChannel;
