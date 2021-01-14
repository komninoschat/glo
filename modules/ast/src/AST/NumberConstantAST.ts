import ConstantAST from './ConstantAST';
import * as Types from '@glossa-glo/data-types';
import AST from './AST';

export default class NumberConstantAST extends ConstantAST {
  public readonly value: Types.GLONumber;
  dataType = Types.GLONumber;
  constructor(value: Types.GLONumber) {
    super();
    this.value = value;
  }

  public promoteMap: Map<typeof Types.GLODataType, () => AST> = new Map();
}
