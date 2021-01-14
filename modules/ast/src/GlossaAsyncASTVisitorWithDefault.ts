import * as AST from './AST';
import GlossaASTVisitorWithDefault from './GlossaASTVisitorWithDefault';

export default abstract class GlossaAsyncASTVisitorWithDefault<
  T
> extends GlossaASTVisitorWithDefault<Promise<T>> {
  public async visitMultipleInOrder(nodes: AST.AST[]) {
    const results: T[] = [];

    for (let i = 0; i < nodes.length; i++) {
      results.push(await this.visit(nodes[i]));
    }

    return results;
  }
}
