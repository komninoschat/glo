import * as AST from './AST';
import PseudoglossaASTVisitor from './PseudoglossaASTVisitor';

export default abstract class AsyncASTVisitor<T> extends PseudoglossaASTVisitor<
  Promise<T>
> {
  public async visitMultipleInOrder(nodes: AST.AST[]) {
    const results: T[] = [];

    for (let i = 0; i < nodes.length; i++) {
      results.push(await this.visit(nodes[i]));
    }

    return results;
  }
}
