export const logLevels = {
  fatal: '\x1b[31m\x1b[30m\x1b[1m',
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[34m',
  debug: '\x1b[32m',
};

export const spotifySongRegex = /(https?:\/\/(embed\.|open\.)spotify\.com\/(track\/|\?uri=spotify:track:)|(spotify:track:))(\w|-){22}/;
export const spotifyPlaylistRegex = /(https?:\/\/(embed\.|open\.)spotify\.com\/(playlist\/|\?uri=spotify:playlist:)|(spotify:playlist:))(\w|-){22}/;
export const spotifyAlbumRegex = /(https?:\/\/(embed\.|open\.)spotify\.com\/(album\/|\?uri=spotify:album:)|(spotify:album:))(\w|-){22}/;
