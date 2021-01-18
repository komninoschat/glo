import GLOSymbol from '../symbol/GLOSymbol';
import CaseInsensitiveMap, {
  toUpperCaseNormalizedGreek,
} from '@glossa-glo/case-insensitive-map';
import ScopeChildren from './ScopeChildren';
import {
  GLODataType,
  GLOArrayLike,
  GLOFunction,
  printType,
} from '@glossa-glo/data-types';
import GLOError from '@glossa-glo/error';
import { VariableSymbol } from '../symbol';
import { SymbolScopeType } from './SymbolScopeType';

export default abstract class SymbolScope {
  private scope: CaseInsensitiveMap<string, GLOSymbol>;
  private value: CaseInsensitiveMap<string, GLODataType>;
  public readonly children: ScopeChildren;
  protected abstract readonly parent: SymbolScope | null;

  constructor(
    public readonly name: string,
    public readonly type: SymbolScopeType,
  ) {
    this.scope = new CaseInsensitiveMap();
    this.value = new CaseInsensitiveMap();
    this.children = new ScopeChildren();
  }

  public nameEquals(name: string) {
    return (
      toUpperCaseNormalizedGreek(this.name) === toUpperCaseNormalizedGreek(name)
    );
  }

  public resolveValue<T extends GLODataType>(name: string): T | null {
    const result = this.value.get(name);
    if (result) {
      return result;
    } else if (this.parent) {
      return this.parent.resolveValue(name);
    } else {
      return null;
    }
  }

  public resolveValueThisScopeOnly<T extends GLODataType>(
    name: string,
  ): T | null {
    const result = this.value.get(name);
    return result || null;
  }

  public changeArrayValue(
    arrayName: string,
    accessors: GLODataType[],
    value: GLODataType,
  ) {
    const scope = this.findScope(arrayName)!;
    const array = scope.resolveValueThisScopeOnly(arrayName)! as GLODataType &
      GLOArrayLike;

    array.changeValue(accessors, value);
  }

  public changeFunctionReturnType(name: string, value: GLODataType) {
    const scope = this.findScope(name)!;

    const fn = scope.resolveValueThisScopeOnly<GLOFunction>(name)!;

    fn.returnValue = value;
    scope.value.set(name, fn);
  }

  public changeValue(name: string, value: GLODataType) {
    const scope = this.findScope(name);

    if (!scope) {
      throw new Error(
        `Program error: Could not find the scope containing the symbol with name ${name} (current scope: ${this.name})`,
      );
    }

    scope.value.set(name, value);
  }

  public change(name: string, value: GLOSymbol): void {
    const scope = this.findScope(name);

    if (!scope) {
      throw new Error(
        `Program error: Could not find the scope containing the symbol with name ${name} (current scope: ${this.name})`,
      );
    }

    scope.scope.set(name, value);
  }

  private findScope(name: string): SymbolScope | null {
    const result = this.scope.get(name);
    if (result) {
      return this;
    } else if (this.parent) {
      return this.parent.findScope(name);
    } else {
      return null;
    }
  }

  public getParent() {
    return this.parent;
  }

  public insert(symbol: GLOSymbol): void {
    if (this.has(symbol)) {
      throw new GLOError(
        symbol,
        `Το αναγνωριστικό '${symbol.name}' χρησιμοποιείται ήδη`,
      );
    }

    this.scope.set(symbol.name, symbol);
    if (symbol instanceof VariableSymbol && symbol.type.defaultValue) {
      this.value.set(symbol.name, symbol.type.defaultValue!);
    }
  }

  public has(symbol: GLOSymbol) {
    return this.scope.has(symbol.name);
  }

  public resolve<T extends typeof GLOSymbol>(
    name: string,
    type?: T,
  ): InstanceType<T> | null {
    const result = this.scope.get(name);
    if (result && (type ? result instanceof type : true)) {
      return result;
    } else if (this.parent) {
      return this.parent.resolve(name, type);
    } else {
      return null;
    }
  }

  // For step execution
  public getVariablesAndConstants() {
    const variableOrConstantList: {
      name: string;
      type: string;
      value: string | undefined;
      isConstant: boolean;
      dimensionLength: number[] | undefined;
    }[] = [];

    for (const [k, v] of this.scope) {
      if (v instanceof VariableSymbol) {
        const value = this.resolveValue(k);

        if (!v.type.isArrayType)
          variableOrConstantList.push({
            name: this.scope.originalKey.get(k)!,
            type: printType(v.type),
            value: value ? value.print() : undefined,
            isConstant: v.isConstant,
            dimensionLength: undefined,
          });
        else {
          const { print, dimensionLength } = value
            ? (value as any).arrayPrint()
            : { print: undefined, dimensionLength: undefined };

          variableOrConstantList.push({
            name: this.scope.originalKey.get(k)!,
            type: 'Πίνακας',
            value: print,
            isConstant: v.isConstant,
            dimensionLength,
          });
        }
      }
    }

    return variableOrConstantList;
  }
}
