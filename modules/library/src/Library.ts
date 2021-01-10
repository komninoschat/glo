import { GLODataType, GLOFunction } from '@glossa-glo/data-types';
import {
  FunctionSymbol,
  SymbolScope,
  VariableSymbol,
} from '@glossa-glo/symbol';
import { DebugInfoProvider } from '@glossa-glo/error';

export class LibraryFunction {
  private readonly functionSymbol: FunctionSymbol;

  constructor(
    name: string,
    types: {
      args: [string, typeof GLODataType][];
      returnType: typeof GLODataType;
    }[],
    public func: (
      args: GLODataType[],
      debugInfoProviders: DebugInfoProvider[],
    ) => GLODataType,
  ) {
    this.functionSymbol = new FunctionSymbol(
      name,
      types[0].args.map(arg => new VariableSymbol(arg[0], arg[1])),
      types[0].returnType,
      types.slice(1).map(type => ({
        args: type.args.map(arg => new VariableSymbol(arg[0], arg[1])),
        returnType: type.returnType,
      })),
    );
  }

  public inject(scope: SymbolScope) {
    scope.insert(this.functionSymbol);
    scope.changeValue(
      this.functionSymbol.name,
      new GLOFunction(async (args, argDebugInfoProviders) => {
        const returnValue = this.func(args, argDebugInfoProviders);
        scope.changeFunctionReturnType(this.functionSymbol.name, returnValue);
      }),
    );
  }
}
