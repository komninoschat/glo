import ConstantAST from './ConstantAST';
import * as Types from '@glossa-glo/data-types';
import RealConstantAST from './RealConstantAST';
import AST from './AST';

export default class IntegerConstantAST extends ConstantAST {
  public readonly value: Types.GLOInteger;
  dataType = Types.GLOInteger;
  constructor(value: Types.GLOInteger) {
    super();
    this.value = value;

    this.promoteMap.set(Types.GLOReal, () => {
      return new RealConstantAST(
        this.value.promote!.get(Types.GLOReal)!() as Types.GLOReal,
      );
    });
  }

  public promoteMap: Map<typeof Types.GLODataType, () => AST> = new Map();
}
