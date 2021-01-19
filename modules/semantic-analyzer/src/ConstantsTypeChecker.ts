// TODO: This module does more than type checking, split it
import * as AST from '@glossa-glo/ast';
import * as Types from '@glossa-glo/data-types';
import { assertTypeEquality } from '@glossa-glo/data-types';
import {
  BaseSymbolScope,
  SymbolScope,
  VariableSymbol,
  ProcedureSymbol,
  FunctionSymbol,
  SymbolScopeType,
  FunctionOverload,
  LocalSymbolScope,
} from '@glossa-glo/symbol';
import GLOError, { assert, assertEquality } from '@glossa-glo/error';

export default class ConstantsTypeChecker extends AST.GlossaASTVisitorWithDefault<
  typeof Types.GLODataType | null
> {
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

  public visitIntegerConstant(node: AST.IntegerConstantAST) {
    return Types.GLOInteger;
  }

  public visitRealConstant(node: AST.RealConstantAST) {
    return Types.GLOReal;
  }

  public visitStringConstant(node: AST.StringConstantAST) {
    return Types.GLOString;
  }

  public visitTrue(node: AST.TrueConstantAST) {
    return Types.GLOBoolean;
  }

  public visitFalse(node: AST.FalseConstantAST) {
    return Types.GLOBoolean;
  }

  public visitVariable(node: AST.VariableAST, assignee = false) {
    if (this.localScope && this.localScope.resolveValue(node.name)) {
      return this.localScope.resolveValue(node.name)!
        .constructor as typeof Types.GLODataType;
    } else return null;
  }

  public visitAssignment(node: AST.AssignmentAST) {
    const left =
      node.left instanceof AST.VariableAST
        ? this.visitVariable(node.left, true)
        : this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
      allowPromoteLeft: false,
      message: `Δεν μπορώ να αναθέσω τιμή τύπου RIGHT_TYPE στη μεταβλητή ${
        node.left instanceof AST.VariableAST
          ? node.left.name
          : node.left.array.name
      } τύπου LEFT_TYPE`,
    });

    return left;
  }

  public visitIntegerDivision(node: AST.IntegerDivisionAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.integerDivide,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return Types.GLOInteger;
  }

  public visitRealDivision(node: AST.RealDivisionAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.divide,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return Types.GLOReal;
  }

  public visitMinus(node: AST.MinusAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.subtract,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return left;
  }

  public visitMultiplication(node: AST.MultiplicationAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.multiply,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return left;
  }

  public visitExponentiation(node: AST.ExponentiationAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.multiply,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return left;
  }

  public visitMod(node: AST.ModAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.mod,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return left;
  }

  public visitPlus(node: AST.PlusAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.add,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return left;
  }

  public visitEquals(node: AST.EqualsAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.equals,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return Types.GLOBoolean;
  }
  public visitNotEquals(node: AST.NotEqualsAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.notEquals,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return Types.GLOBoolean;
  }
  public visitGreaterThan(node: AST.GreaterThanAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.greaterThan,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return Types.GLOBoolean;
  }
  public visitLessThan(node: AST.LessThanAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.lessThan,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return Types.GLOBoolean;
  }
  public visitGreaterEquals(node: AST.GreaterEqualsAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.greaterEqualsThan,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return Types.GLOBoolean;
  }
  public visitLessEquals(node: AST.LessEqualsAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertTypeEquality({
      node,
      left,
      right,
    });

    assert(
      node,
      left.prototype.lessEqualsThan,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left,
      )}`,
    );

    return Types.GLOBoolean;
  }
  public visitAnd(node: AST.AndAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertEquality(
      node,
      left,
      Types.GLOBoolean,
      `Περίμενα τον αριστερό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(left)}`,
    );
    assertEquality(
      node,
      right,
      Types.GLOBoolean,
      `Περίμενα τον δεξιό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(left)}`,
    );

    return Types.GLOBoolean;
  }
  public visitOr(node: AST.OrAST) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    if (!left || !right) return null;

    assertEquality(
      node,
      left,
      Types.GLOBoolean,
      `Περίμενα τον αριστερό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(left)}`,
    );
    assertEquality(
      node,
      right,
      Types.GLOBoolean,
      `Περίμενα τον δεξιό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(left)}`,
    );

    return Types.GLOBoolean;
  }

  public visitNot(node: AST.NotAST) {
    const target = this.visit(node.target);

    if (!target) return null;

    assertEquality(
      node,
      target,
      Types.GLOBoolean,
      `Περίμενα τον τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(target)}`,
    );

    return Types.GLOBoolean;
  }

  public visitUnaryMinus(node: AST.UnaryMinusAST) {
    const target = this.visit(node.target);

    if (!target) return null;

    assert(
      node,
      target.prototype.unaryMinus,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέο τύπου ${Types.printType(
        target,
      )}`,
    );

    return this.visit(node.target);
  }

  public visitUnaryPlus(node: AST.UnaryPlusAST) {
    const target = this.visit(node.target);

    if (!target) return null;

    assert(
      node,
      target.prototype.unaryPlus(),
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέο τύπου ${Types.printType(
        target,
      )}`,
    );

    return this.visit(node.target);
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

  public visitFunctionCall(node: AST.FunctionCallAST) {
    const symbol = this.baseScope.resolve<typeof FunctionSymbol>(node.name);

    if (!symbol) return null;

    const overloads: {
      0: FunctionOverload;
    } & FunctionOverload[] = [symbol, ...symbol.overloads];

    for (let i = 0; i < node.args.length; i++) {
      const argAST = node.args[i];
      const arg = this.visit(argAST);

      if (!arg) continue;

      const mismatches: typeof Types.GLODataType[] = [];

      for (const overload of overloads) {
        try {
          assertTypeEquality({
            node: argAST,
            left: overload.args[i].type,
            right: arg,
            allowPromoteLeft: false,
          });
          break;
        } catch {
          mismatches.push(overload.args[i].type);
        }
      }

      if (mismatches.length === overloads.length) {
        throw new GLOError(
          argAST,
          `Περίμενα την παράμετρο '${
            overloads[0].args[i].name
          }' να είναι τύπου ${Types.printType(mismatches[0])}${mismatches
            .slice(1)
            .map((type) => ` ή ${Types.printType(type)}`)
            .join('')}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(arg)}`,
        );
      }
    }

    return symbol.returnType;
  }

  public visitFor(node: AST.ForAST) {
    const counterType = this.visit(node.counter);

    if (!counterType) return null;

    assertEquality(
      node.counter,
      counterType,
      Types.GLOInteger,
      `Περίμενα τον μετρητή επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOInteger,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(counterType)}`,
    );

    const startValueType = this.visit(node.startValue);

    if (!startValueType) return null;

    assertEquality(
      node.startValue,
      startValueType,
      Types.GLOInteger,
      `Περίμενα την αρχική τιμή επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOInteger,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(startValueType)}`,
    );

    const endValueType = this.visit(node.endValue);

    if (!endValueType) return null;

    assertEquality(
      node.endValue,
      endValueType,
      Types.GLOInteger,
      `Περίμενα την τελική επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOInteger,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(endValueType)}`,
    );

    const stepType = this.visit(node.step);

    if (!stepType) return null;

    assertEquality(
      node.step,
      stepType,
      Types.GLOInteger,
      `Περίμενα το βήμα επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOInteger,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(stepType)}`,
    );

    this.visitMultiple(node.statementList);
    return Types.GLOVoid;
  }

  public visitWhile(node: AST.WhileAST) {
    const conditionType = this.visit(node.condition);

    if (!conditionType) return null;

    assertEquality(
      node.condition,
      conditionType,
      Types.GLOBoolean,
      `Περίμενα τη συνθήκη επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(conditionType)}`,
    );

    this.visitMultiple(node.statementList);
    return Types.GLOVoid;
  }

  public visitRepeat(node: AST.RepeatAST) {
    const conditionType = this.visit(node.condition);

    if (!conditionType) return null;

    assertEquality(
      node.condition,
      conditionType,
      Types.GLOBoolean,
      `Περίμενα τη συνθήκη επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(conditionType)}`,
    );

    this.visitMultiple(node.statementList);
    return Types.GLOVoid;
  }

  public visitFunctionDeclaration(node: AST.FunctionDeclarationAST) {
    this.withLocalScope(node.name.name, SymbolScopeType.Function, () => {
      this.visitMultiple(node.children);
    });
    return null;
  }

  public defaultVisit(node: AST.AST) {
    this.visitMultiple(node.children);
    return null;
  }

  public run() {
    return this.visit(this.ast);
  }
}
