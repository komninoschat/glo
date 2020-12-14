import AST from './AST';
import { GLODataType } from '@glossa-glo/data-types';

export default abstract class ConstantAST extends AST {
  public abstract readonly value: GLODataType;
  public abstract dataType?: typeof GLODataType;

  public abstract promote: Map<typeof GLODataType, () => AST>;
}
