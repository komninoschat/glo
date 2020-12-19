import ConstantAST from './ConstantAST';
import AST from './AST';
import * as Types from '@glossa-glo/data-types';

export default class RealConstantAST extends ConstantAST {
  public readonly value: Types.GLOReal;
  dataType = Types.GLOReal;
  constructor(value: Types.GLOReal) {
    super();
    this.value = value;
  }

  public promoteMap: Map<typeof Types.GLODataType, () => AST> = new Map();
}
