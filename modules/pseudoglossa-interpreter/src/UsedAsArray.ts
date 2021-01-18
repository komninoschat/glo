import {
  ArrayAccessAST,
  AST,
  PseudoglossaASTVisitorWithDefault,
} from '@glossa-glo/ast';

export default class UsedAsArray extends PseudoglossaASTVisitorWithDefault {
  private readonly usedAsArray: { name: string; dimensions: number }[] = [];

  constructor(public readonly ast: AST) {
    super();
  }

  defaultVisit(node: AST) {
    node.children.forEach(this.visit.bind(this));
  }

  visitArrayAccess(node: ArrayAccessAST) {
    if (!this.usedAsArray.find((a) => a.name == node.array.name))
      this.usedAsArray.push({
        name: node.array.name,
        dimensions: node.accessors.length,
      });
  }

  run() {
    this.visit(this.ast);
    return this.usedAsArray;
  }
}
