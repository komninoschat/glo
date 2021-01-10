import ArrayAccessAST from './ArrayAccessAST';
import BinaryAST from './BinaryAST';
import VariableAST from './VariableAST';

export default class SwapAST extends BinaryAST {
  constructor(
    public readonly left: VariableAST | ArrayAccessAST,
    public readonly right: VariableAST | ArrayAccessAST,
  ) {
    super(left, right);
  }
}
