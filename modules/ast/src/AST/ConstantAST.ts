import AST from './AST';
import { GLODataType } from '@glossa-glo/data-types';
import GLOError from '@glossa-glo/error';

export default abstract class ConstantAST extends AST {
  public abstract readonly value: GLODataType;
  public abstract dataType?: typeof GLODataType;

  public promote(target: typeof GLODataType): AST {
    const promoteFunc = this.promoteMap.get(target);

    if (!promoteFunc) {
      throw new GLOError(
        this,
        `Cannot promote ${this.constructor.name} to ${target.name}`,
      );
    }

    return promoteFunc();
  }

  public abstract promoteMap: Map<typeof GLODataType, () => AST>;
}
