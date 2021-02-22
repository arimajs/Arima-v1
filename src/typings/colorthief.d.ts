declare module 'colorthief' {
  // eslint-disable-next-line import/prefer-default-export
  export function getColor(
    image: import('../lib/utils/types')
  ): Promise<[number, number, number]>;
}
