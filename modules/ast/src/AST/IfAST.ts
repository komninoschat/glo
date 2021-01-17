import AST from './AST';

export default class IfAST extends AST {
  public next: IfAST | AST[] | null = null;
  constructor(
    public readonly condition: AST,
    public readonly statementList: AST[],
    public readonly isOneLine = false,
  ) {
    super();
    this.addChild(condition, ...statementList);
  }

  public addNext(next: IfAST | AST[]) {
    if (this.next) {
      throw new Error('Cannot add next if node more than once');
    }
    this.next = next;
    if (Array.isArray(next)) {
      for (let i = 0; i < next.length; i++) {
        this.addChild(next[i]);
      }
    } else this.addChild(next);
  }
}
