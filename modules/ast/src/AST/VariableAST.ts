import { GLODataType } from '@glossa-glo/data-types';
import AST from './AST';
import type { SymbolScope, VariableSymbol } from '@glossa-glo/symbol';

export default class VariableAST extends AST {
  public readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  promote(target: typeof GLODataType, scope: SymbolScope) {
    const symbol = scope.resolve<typeof VariableSymbol>(this.name)!;

    symbol.type = target;

    scope.change(this.name, symbol);

    return this;
  }
}
