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
} from '@glossa-glo/symbol';
import GLOError, { assert, assertEquality } from '@glossa-glo/error';

export default class TypeChecker extends AST.GlossaASTVisitorWithDefault<
  typeof Types.GLODataType
> {
  private currentScope: SymbolScope;
  private throwOnIOVisit = false;
  private throwOnIOVisitErrorMessageSuffix = '';

  constructor(protected readonly ast: AST.AST, baseScope: BaseSymbolScope) {
    super();
    this.currentScope = baseScope;
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
    const symbol = this.currentScope.resolve(node.name)!;

    if (symbol instanceof VariableSymbol) {
      return symbol.type;
    } else if (
      symbol instanceof FunctionSymbol &&
      this.currentScope.type === SymbolScopeType.Function && // Is inside function
      this.currentScope.nameEquals(node.name) && // Variable name matches function name
      assignee // Variable the left side of an assignment expression
    ) {
      return symbol.returnType;
    } else
      throw new GLOError(
        node,
        'Program error: Attempted to type check non variable or function',
      );
  }

  public visitAssignment(node: AST.AssignmentAST) {
    const left =
      node.left instanceof AST.VariableAST
        ? this.visitVariable(node.left, true)
        : this.visit(node.left);
    const right = this.visit(node.right);

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    let left = this.visit(node.left);
    let right = this.visit(node.right);

    const { promoteLeft, promoteRight } = assertTypeEquality({
      node,
      left,
      right,
    });

    if (promoteLeft && left !== promoteLeft) {
      left = promoteLeft;
      node.left = node.left.promote!(promoteLeft, this.currentScope as any);
    }

    if (promoteRight && right !== promoteRight) {
      right = promoteRight;
      node.right = node.right.promote!(promoteRight, this.currentScope as any);
    }

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
    this.currentScope = this.currentScope.children.get(node.name)!;

    this.visitMultiple(node.declarations);
    this.visitMultiple(node.statementList);

    this.currentScope = this.currentScope.getParent()!;
    return Types.GLOVoid;
  }

  public visitProcedureDeclaration(node: AST.ProcedureDeclarationAST) {
    this.currentScope = this.currentScope.children.get(node.name.name)!;

    this.visitMultiple(node.constantDeclarations);
    this.visitMultiple(node.variableDeclarations);
    this.visitMultiple(node.statementList);

    this.currentScope = this.currentScope.getParent()!;
    return Types.GLOVoid;
  }

  public visitFunctionCall(node: AST.FunctionCallAST) {
    const symbol = this.currentScope.resolve<typeof FunctionSymbol>(node.name)!;

    const overloads: {
      0: FunctionOverload;
    } & FunctionOverload[] = [symbol, ...symbol.overloads];

    for (let i = 0; i < node.args.length; i++) {
      const argAST = node.args[i];
      const arg = this.visit(argAST);

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

  public visitProcedureCall(node: AST.ProcedureCallAST) {
    const symbol = this.currentScope.resolve<typeof ProcedureSymbol>(
      node.name,
    )!;

    symbol.args.forEach(
      ({ type: declarationType, name: argDeclarationName }, i) => {
        const argAST = node.args[i];
        const arg = this.visit(argAST);

        assertTypeEquality({
          node: argAST,
          left: declarationType,
          right: arg,
          allowPromoteLeft: false,
          message: `Περίμενα την παράμετρο '${argDeclarationName}' να είναι τύπου LEFT_TYPE, αλλά έλαβα μη συμβατό τύπο RIGHT_TYPE`,
        });
      },
    );

    return Types.GLOVoid;
  }

  public visitFor(node: AST.ForAST) {
    const counterType = this.visit(node.counter);
    assertEquality(
      node.counter,
      counterType,
      Types.GLOInteger,
      `Περίμενα τον μετρητή επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOInteger,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(counterType)}`,
    );

    const startValueType = this.visit(node.startValue);
    assertEquality(
      node.startValue,
      startValueType,
      Types.GLOInteger,
      `Περίμενα την αρχική τιμή επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOInteger,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(startValueType)}`,
    );

    const endValueType = this.visit(node.endValue);
    assertEquality(
      node.endValue,
      endValueType,
      Types.GLOInteger,
      `Περίμενα την τελική επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOInteger,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(endValueType)}`,
    );

    const stepType = this.visit(node.step);
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

  public visitArrayAccess(node: AST.ArrayAccessAST) {
    const array = (this.currentScope.resolve(node.array.name, VariableSymbol)!
      .type as unknown) as {
      componentType: typeof Types.GLODataType;
    };

    for (let i = 0; i < node.accessors.length; i++) {
      const accessor = node.accessors[i];

      assertTypeEquality({
        node: accessor,
        left: Types.GLOInteger,
        right: this.visit(accessor),
        message: `Περίμενα τον δείκτη του πίνακα '${node.array.name}' να είναι τύπου LEFT_TYPE αλλά έλαβα μη συμβατό τύπο RIGHT_TYPE`,
        allowPromoteLeft: false,
      });
    }

    return array.componentType;
  }

  public visitFunctionDeclaration(node: AST.FunctionDeclarationAST) {
    this.currentScope = this.currentScope.children.get(node.name.name)!;

    this.throwOnIOVisit = true;
    this.throwOnIOVisitErrorMessageSuffix = 'μέσα σε συνάρτηση';
    this.visitMultiple(node.constantDeclarations);
    this.visitMultiple(node.variableDeclarations);
    this.visitMultiple(node.statementList);
    this.throwOnIOVisit = false;
    this.throwOnIOVisitErrorMessageSuffix = '';

    this.currentScope = this.currentScope.getParent()!;
    return Types.GLOVoid;
  }

  public visitRead(node: AST.ReadAST) {
    if (this.throwOnIOVisit) {
      throw new GLOError(
        node,
        `Απαγορεύεται εντολή Διάβασε ${this.throwOnIOVisitErrorMessageSuffix}`,
      );
    }

    node.args.forEach((arg) => {
      const argType = this.visit(arg);
      if (!Types.canBeRead(argType)) {
        throw new GLOError(
          arg,
          `Δεν μπορώ να διαβάσω μεταβλητή με τύπο ${Types.printType(argType)}`,
        );
      }
    });

    return Types.GLOVoid;
  }

  public visitWrite(node: AST.WriteAST) {
    if (this.throwOnIOVisit) {
      throw new GLOError(
        node,
        `Απαγορεύεται εντολή Γράψε ${this.throwOnIOVisitErrorMessageSuffix}`,
      );
    }

    node.args.forEach((arg) => {
      const argType = this.visit(arg);
      if (!Types.canBeWritten(argType)) {
        throw new GLOError(
          arg,
          `Δεν μπορώ να γράψω μεταβλητή με τύπο ${Types.printType(argType)}`,
        );
      }
    });

    return Types.GLOVoid;
  }

  public defaultVisit(node: AST.AST) {
    node.children.forEach(this.visit.bind(this));
    return Types.GLOVoid;
  }

  public run() {
    return this.visit(this.ast);
  }
}
