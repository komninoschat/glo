import { Lexer, Mode } from '@glossa-glo/lexer';
import { AST } from '@glossa-glo/ast';
import { Parser } from '@glossa-glo/parser';
import { Interpreter } from '@glossa-glo/interpreter';
import {
  SymbolBuilder,
  TypeChecker,
  SimplifyConstants,
} from '@glossa-glo/semantic-analyzer';
import { BaseSymbolScope, SymbolScope } from '@glossa-glo/symbol';
import injectLibraryToScope from '@glossa-glo/library-glossa';
import { DebugInfoProvider } from '@glossa-glo/error';

export interface Options {
  read: (debugInfoProvider: DebugInfoProvider) => Promise<string>;
  write: (...data: string[]) => Promise<void>;
  interceptor?: (node: AST, scope: SymbolScope) => Promise<void>;
}

export default async function interpret(
  sourceCode: string,
  options: Options,
): Promise<void> {
  const lexer = new Lexer(sourceCode, Mode.Glossa);
  const tree = new Parser(lexer).run();
  const baseScope = new BaseSymbolScope('root');
  injectLibraryToScope(baseScope);
  new SimplifyConstants(tree, baseScope).run();
  new SymbolBuilder(tree, baseScope).run();
  new TypeChecker(tree, baseScope).run();
  const interpreter = new Interpreter(tree, baseScope, options);
  await interpreter.run();
}
