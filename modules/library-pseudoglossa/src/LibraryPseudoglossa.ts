import { SymbolScope } from '@glossa-glo/symbol';
import absoluteValue from './absoluteValue';
import cosine from './cosine';
import exponential from './exponential';
import naturalLogarithm from './naturalLogarithm';
import sine from './sine';
import squareRoot from './squareRoot';
import tangent from './tangent';
import trunctuateReal from './trunctuateReal';

export default function injectLibraryToScope(scope: SymbolScope) {
  cosine.inject(scope);
  exponential.inject(scope);
  naturalLogarithm.inject(scope);
  sine.inject(scope);
  tangent.inject(scope);
  trunctuateReal.inject(scope);
  squareRoot.inject(scope);
  absoluteValue.inject(scope);
}
