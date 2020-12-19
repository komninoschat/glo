import ConstantAST from './ConstantAST';
import AST from './AST';
import * as Types from '@glossa-glo/data-types';

export default class StringConstantAST extends ConstantAST {
  public readonly value: Types.GLOString;
  dataType = Types.GLOString;

  constructor(value: Types.GLOString) {
    super();
    this.value = value;
  }

  public promoteMap: Map<typeof Types.GLODataType, () => AST> = new Map();
}
