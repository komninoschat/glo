import GLOSymbol from './GLOSymbol';
import * as Types from '@glossa-glo/data-types';
import { AST } from '@glossa-glo/ast';

export default class VariableSymbol extends GLOSymbol {
  constructor(
    name: string,
    public type: typeof Types.GLODataType,
    public readonly isConstant = false,
    public readonly dimensionLength?: AST[],
  ) {
    super(name);
  }

  public print() {
    return this.dimensionLength ? 'Πίνακας' : 'Μεταβλητή';
  }
}
