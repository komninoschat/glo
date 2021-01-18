import * as AST from '@glossa-glo/ast';
import GLOError from '@glossa-glo/error';
import * as Types from '@glossa-glo/data-types';
import {
  BaseSymbolScope,
  LocalSymbolScope,
  SymbolScopeType,
  VariableSymbol,
} from '@glossa-glo/symbol';

export default class SimplifyConstants extends AST.GlossaASTVisitorWithDefault<Types.GLODataType | null> {
  private localScope: LocalSymbolScope | null = null;

  constructor(
    protected readonly ast: AST.AST,
    private readonly baseScope: BaseSymbolScope,
  ) {
    super();
  }

  private withLocalScope(name: string, type: SymbolScopeType, fn: () => void) {
    this.localScope = new LocalSymbolScope(name, type, this.baseScope);
    fn();
    this.localScope = null;
  }

  public visitArray(node: AST.ArrayAST) {
    this.visit(node.componentType);
    const dimensionLength = this.visitMultiple(node.dimensionLength);

    for (let i = 0; i < dimensionLength.length; i++) {
      const len = dimensionLength[i];

      if (!len) {
        throw new GLOError(
          node.dimensionLength[i],
          `Περίμενα σταθερή έκφραση για διάσταση ${i + 1} του πίνακα`,
        );
      }

      if (len instanceof Types.GLOInteger) {
        node.dimensionLengthNumbers.push(len.serialize());
      } else {
        // If we do not push anything, there will be a mismatch
        // of access parameters but pushing -1 when the argument
        // is not an integer will let TypeChecker resolve this
        node.dimensionLengthNumbers.push(-1);
      }
    }

    return null;
  }

  public visitConstantDeclaration(node: AST.ConstantDeclarationAST) {
    const value = this.visit(node.expression);

    if (value) {
      node.type = value.constructor as typeof Types.GLODataType;
      node.value = value;
    } else {
      throw new GLOError(
        node.expression,
        'Περίμενα σταθερή έκφραση στη δήλωση σταθεράς',
      );
    }

    if (this.localScope) {
      this.localScope.insert(
        new VariableSymbol(
          node.variable.name,
          value.constructor as typeof Types.GLODataType,
          true,
        ),
      );
      this.localScope.changeValue(node.variable.name, value);
    }

    return null;
  }

  public visitVariable(node: AST.VariableAST) {
    // We only enter constants on scopes
    if (this.localScope && this.localScope.resolveValue(node.name)) {
      return this.localScope.resolveValue(node.name);
    } else return null;
  }

  public visitProgram(node: AST.ProgramAST) {
    this.withLocalScope(node.name, SymbolScopeType.Program, () => {
      this.visitMultiple(node.declarations);
      this.visitMultiple(node.statementList);
    });

    return null;
  }

  public visitProcedureDeclaration(node: AST.ProcedureDeclarationAST) {
    this.withLocalScope(node.name.name, SymbolScopeType.Procedure, () => {
      this.visitMultiple(node.children);
    });
    return null;
  }

  public visitFunctionDeclaration(node: AST.FunctionDeclarationAST) {
    this.withLocalScope(node.name.name, SymbolScopeType.Function, () => {
      this.visitMultiple(node.children);
    });
    return null;
  }

  public visitFunctionCall(node: AST.FunctionCallAST) {
    const args = node.args.map((arg) => this.visit(arg));
    const func = this.baseScope.resolveValue<Types.GLOFunction>(node.name);

    if (!func) {
      return null;
    }

    for (const arg of args) {
      if (arg === null) {
        return null;
      }
    }

    func.call(args as Types.GLODataType[], node.args);

    const returnValue = this.baseScope.resolveValue<Types.GLOFunction>(
      node.name,
    )!.returnValue;

    if (!returnValue) {
      return null;
    }

    return returnValue;
  }

  public visitIntegerConstant(node: AST.IntegerConstantAST) {
    return node.value;
  }

  public visitRealConstant(node: AST.RealConstantAST) {
    return node.value;
  }

  public visitStringConstant(node: AST.StringConstantAST) {
    return node.value;
  }

  public visitTrue(node: AST.TrueConstantAST) {
    return new Types.GLOBoolean(true);
  }

  public visitFalse(node: AST.FalseConstantAST) {
    return new Types.GLOBoolean(false);
  }

  public visitUnaryPlus(node: AST.UnaryPlusAST) {
    const target = this.visit(node.target);
    return target ? target.unaryPlus() : null;
  }

  public visitUnaryMinus(node: AST.UnaryMinusAST) {
    const target = this.visit(node.target);
    return target ? target.unaryMinus() : null;
  }

  public visitAnd(node: AST.AndAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    return right && left
      ? new Types.GLOBoolean(
          left.equals(Types.GLOBoolean.true) &&
            right.equals(Types.GLOBoolean.true),
        )
      : null;
  }
  public visitOr(node: AST.OrAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    return right && left
      ? new Types.GLOBoolean(
          left.equals(Types.GLOBoolean.true) ||
            right.equals(Types.GLOBoolean.true),
        )
      : null;
  }
  public visitNot(node: AST.NotAST) {
    const target = this.visit(node.target);
    return target
      ? target.equals(Types.GLOBoolean.true)
        ? Types.GLOBoolean.false
        : Types.GLOBoolean.true
      : null;
  }

  public visitPlus(node: AST.PlusAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right ? left.add(right) : null;
  }

  public visitMinus(node: AST.MinusAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right ? left.subtract(right) : null;
  }

  public visitIntegerDivision(node: AST.IntegerDivisionAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (right && right.equals(new Types.GLOInteger(0))) {
      throw new GLOError(node, 'Δεν μπορώ να διαιρέσω με το μηδέν');
    }

    return right && left ? left.integerDivide(right) : null;
  }

  public visitRealDivision(node: AST.RealDivisionAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (
      right &&
      (right.equals(new Types.GLOInteger(0)) ||
        right.equals(new Types.GLOReal(0)))
    ) {
      throw new GLOError(node, 'Δεν μπορώ να διαιρέσω με το μηδέν');
    }

    return left && right ? left.divide(right) : null;
  }

  public visitMultiplication(node: AST.MultiplicationAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right ? left.multiply(right) : null;
  }

  public visitExponentiation(node: AST.MultiplicationAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right ? left.exponent(right) : null;
  }

  public visitMod(node: AST.ModAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (
      right &&
      (right.equals(new Types.GLOInteger(0)) ||
        right.equals(new Types.GLOReal(0)))
    ) {
      throw new GLOError(node, 'Δεν μπορώ να κάνω mod με το μηδέν');
    }

    return left && right ? left.mod(right) : null;
  }

  public visitEquals(node: AST.EqualsAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right ? new Types.GLOBoolean(left.equals(right)) : null;
  }
  public visitNotEquals(node: AST.NotEqualsAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right ? new Types.GLOBoolean(left.notEquals(right)) : null;
  }
  public visitGreaterThan(node: AST.GreaterThanAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right ? new Types.GLOBoolean(left.greaterThan(right)) : null;
  }
  public visitLessThan(node: AST.LessThanAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right ? new Types.GLOBoolean(left.lessThan(right)) : null;
  }
  public visitGreaterEquals(node: AST.GreaterEqualsAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right
      ? new Types.GLOBoolean(left.greaterEqualsThan(right))
      : null;
  }
  public visitLessEquals(node: AST.LessEqualsAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    return left && right
      ? new Types.GLOBoolean(left.lessEqualsThan(right))
      : null;
  }

  public defaultVisit(node: AST.AST) {
    this.visitMultiple(node.children);
    return null;
  }

  public run() {
    return this.visit(this.ast);
  }
}
