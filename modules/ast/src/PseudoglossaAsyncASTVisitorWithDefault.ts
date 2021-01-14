import * as AST from './AST';
import PseudoglossaASTVisitorWithDefault from './ASTVisitorWithDefault';

export default abstract class PseudoglossaAsyncASTVisitorWithDefault<
  T
> extends PseudoglossaASTVisitorWithDefault<Promise<T>> {
  public async visitMultipleInOrder(nodes: AST.AST[]) {
    const results: T[] = [];

    for (let i = 0; i < nodes.length; i++) {
      results.push(await this.visit(nodes[i]));
    }

    return results;
  }
}
