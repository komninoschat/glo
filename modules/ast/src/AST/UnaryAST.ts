import { GLODataType } from '@glossa-glo/data-types';
import type { SymbolScope } from '@glossa-glo/symbol';
import AST from './AST';

export default abstract class UnaryAST extends AST {
  constructor(public target: AST) {
    super();
    this.addChild(target);
  }

  public promote(target: typeof GLODataType, scope: SymbolScope) {
    this.target = this.target.promote!(target, scope);
    return this;
  }
}
