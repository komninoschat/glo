import GLOSymbol from './GLOSymbol';
import VariableSymbol from './VariableSymbol';
import * as Types from '@glossa-glo/data-types';

export interface FunctionOverload {
  args: VariableSymbol[];
  returnType: typeof Types.GLODataType;
}

export default class FunctionSymbol
  extends GLOSymbol
  implements FunctionOverload {
  public readonly args: VariableSymbol[];

  constructor(
    name: string,
    args: VariableSymbol[],
    public readonly returnType: typeof Types.GLODataType,
    public readonly overloads: FunctionOverload[] = [], // Only used by built-in function Α_Τ
  ) {
    super(name);
    this.args = args;
    [args.length, ...overloads.map((overload) => overload.args.length)].reduce(
      (a, b, i) => {
        if (a != b) {
          throw new Error(
            `Overloads ${
              i - 1
            } and ${i} of function ${name} do not have the same number of arguments`,
          );
        }
        return a;
      },
    );
  }

  public print() {
    return 'Συνάρτηση';
  }
}
