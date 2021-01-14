import * as AST from './AST';
import GlossaASTVisitor from './GlossaASTVisitor';

export default abstract class GlossaAsyncASTVisitor<T> extends GlossaASTVisitor<
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
