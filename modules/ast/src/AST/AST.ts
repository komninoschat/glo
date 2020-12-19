import { DebugInfoProvider } from '@glossa-glo/error';
import { GLODataType } from '@glossa-glo/data-types';

interface AST {
  promote?(target: typeof GLODataType): AST;
}

abstract class AST extends DebugInfoProvider {
  constructor(..._: any[]) {
    super();
  }

  protected readonly _children: AST[] = [];
  public parent: AST | null = null;

  get children() {
    return this._children;
  }

  public addChild(...children: AST[]) {
    children.forEach(child => {
      child.parent = this;
      this._children.push(child);
    });
  }
}

export default AST;
