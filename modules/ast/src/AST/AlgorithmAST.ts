import AST from './AST';

export default class AlgorithmAST extends AST {
  constructor(
    public readonly name: string,

    public readonly statementList: AST[],
  ) {
    super();
    this.addChild(...statementList);
    this.name = name;
  }
}
