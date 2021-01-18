import { GLODataType } from '@glossa-glo/data-types';
import AST from './AST';

export default class FunctionCallAST extends AST {
  constructor(public readonly name: string, public readonly args: AST[]) {
    super();
    this.addChild(...args);
  }

  public runtimePromote: null | typeof GLODataType = null;

  public promote(target: typeof GLODataType) {
    this.runtimePromote = target;
    return this;
  }
}
