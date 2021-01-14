import ArrayAccessAST from './ArrayAccessAST';
import AST from './AST';
import VariableAST from './VariableAST';

export default class SwapAST extends AST {
  constructor(
    public readonly left: VariableAST | ArrayAccessAST,
    public readonly right: VariableAST | ArrayAccessAST,
  ) {
    super();
    this.addChild(left, right);
  }
}
