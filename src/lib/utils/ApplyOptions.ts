import { AkairoModule, AkairoModuleOptions } from '@arimajs/discord-akairo';

// clever class decorator so you don't have to use
// constructor() {
//   super(id, options)
// }
// all the time
export default function ApplyOptions<T extends AkairoModuleOptions>(
  id: string,
  options?: T
): ClassDecorator {
  return ((target: new (...args: unknown[]) => AkairoModule) =>
    class extends target {
      public constructor() {
        super(id, options);
      }
    }) as ClassDecorator;
}
