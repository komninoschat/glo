import { Lexer, Mode } from '@glossa-glo/lexer';
import { AST } from '@glossa-glo/ast';
import { Parser } from '@glossa-glo/parser';
import { PseudoglossaInterpreter } from '@glossa-glo/pseudoglossa-interpreter';
import { BaseSymbolScope, SymbolScope } from '@glossa-glo/symbol';
import injectLibraryToScope from '@glossa-glo/library-pseudoglossa';
import { DebugInfoProvider } from '@glossa-glo/error';

export interface Options {
  read: (
    debugInfoProvider: DebugInfoProvider,
    dimensions: number,
  ) => Promise<{
    reading: string;
    values?: { accessors: number[]; value: string }[];
  }>;
  write: (...data: string[]) => Promise<void>;
  interceptor?: (node: AST, scope: SymbolScope) => Promise<void>;
}

export default async function interpret(
  sourceCode: string,
  options: Options,
): Promise<void> {
  const lexer = new Lexer(sourceCode, Mode.Pseudoglossa);
  const tree = new Parser(lexer).run();
  const baseScope = new BaseSymbolScope('root');
  injectLibraryToScope(baseScope);
  const interpreter = new PseudoglossaInterpreter(tree, baseScope, options);
  await interpreter.run();
}
