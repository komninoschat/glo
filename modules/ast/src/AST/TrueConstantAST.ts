import ConstantAST from './ConstantAST';
import AST from './AST';
import { GLOBoolean, GLODataType } from '@glossa-glo/data-types';

export default class TrueConstantAST extends ConstantAST {
  public readonly value = new GLOBoolean(true);
  dataType = GLOBoolean;

  public promoteMap: Map<typeof GLODataType, () => AST> = new Map();
}
