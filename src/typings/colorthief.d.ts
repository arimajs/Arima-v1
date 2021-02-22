declare module 'colorthief' {
  import type { URL } from '../lib/utils/types';

  // eslint-disable-next-line import/prefer-default-export
  export function getColor(image: URL): Promise<[number, number, number]>;
}
