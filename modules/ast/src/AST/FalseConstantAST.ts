import ConstantAST from './ConstantAST';
import AST from './AST';
import { GLOBoolean, GLODataType } from '@glossa-glo/data-types';

export default class FalseConstantAST extends ConstantAST {
  public readonly value = new GLOBoolean(false);
  dataType = GLOBoolean;

  public promoteMap: Map<typeof GLODataType, () => AST> = new Map();
}
