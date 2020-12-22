import * as AST from './AST';
import ASTVisitorWithDefault from './ASTVisitorWithDefault';

export default abstract class AsyncASTVisitorWithDefault<
  T
> extends ASTVisitorWithDefault<Promise<T>> {
  public async visitMultipleInOrder(nodes: AST.AST[]) {
    const results: T[] = [];

    for (let i = 0; i < nodes.length; i++) {
      results.push(await this.visit(nodes[i]));
    }

    return results;
  }
}
