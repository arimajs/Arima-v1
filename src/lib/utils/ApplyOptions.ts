import { AkairoModule, AkairoModuleOptions } from 'discord-akairo';

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
