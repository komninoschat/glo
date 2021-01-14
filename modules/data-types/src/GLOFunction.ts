import { GLODataType } from '.';
import { DebugInfoProvider } from '@glossa-glo/error';

export default class GLOFunction extends GLODataType {
  public returnValue: GLODataType | null = null;

  constructor(
    public readonly call: (
      args: GLODataType[],
      argDebugInfoProviders: DebugInfoProvider[],
    ) => Promise<void>,
  ) {
    super();
  }

  public print(): string {
    throw new Error('Program error: Cannot print function');
  }
}
