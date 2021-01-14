import * as Types from '@glossa-glo/data-types';
import { assertInstanceTypeEquality } from '@glossa-glo/data-types';
import * as AST from '@glossa-glo/ast';
import {
  SymbolScope,
  BaseSymbolScope,
  LocalSymbolScope,
  VariableSymbol,
  SymbolScopeType,
  AlgorithmSymbol,
} from '@glossa-glo/symbol';
import GLOError, {
  assertEquality,
  assert,
  DebugInfoProvider,
} from '@glossa-glo/error';

export class PseudoglossaInterpreter extends AST.PseudoglossaAsyncASTVisitorWithDefault<
  Types.GLODataType
> {
  private scope: SymbolScope;

  constructor(
    protected readonly ast: AST.AST,
    public readonly baseScope: BaseSymbolScope,
    private readonly options: {
      read: (debugInfoProvider: DebugInfoProvider) => Promise<string>;
      write: (...data: string[]) => Promise<void>;
      interceptor?: (node: AST.AST, scope: SymbolScope) => Promise<void>;
    },
  ) {
    super();
    this.scope = baseScope;
  }

  public async visit(node: AST.AST) {
    if (this.options.interceptor) {
      await this.options.interceptor(node, this.scope);
    }

    return super.visit(node);
  }

  private async withNewScope<T>(
    name: string,
    fn: (scope: LocalSymbolScope) => Promise<T>,
    type?: SymbolScopeType,
  ) {
    let scope = this.scope.children.get(name);

    if (!scope) {
      if (type) scope = new LocalSymbolScope(name, type, this.scope);
      else
        throw new Error(
          `Program error: Scope with name ${name} does not exist on scope ${this.scope.name}`,
        );
    }

    this.scope = scope;
    const result = await fn(scope);
    this.scope = this.scope.getParent()!;
    return result;
  }

  public async visitAssignment(node: AST.AssignmentAST) {
    const left = node.left;
    const newValue = await this.visit(node.right);

    const leftSymbol = this.scope.resolve(
      left instanceof AST.VariableAST ? left.name : left.array.name,
    )!;
    if (!(leftSymbol instanceof VariableSymbol)) {
      throw new GLOError(
        node.left,
        `Το σύμβολο ${
          left instanceof AST.VariableAST ? left.name : left.array.name
        } έχει χρησιμοποιηθεί ήδη ως ${leftSymbol.print()}.`,
      );
    }

    if (left instanceof AST.VariableAST) {
      if (!this.scope.resolve(left.name))
        this.scope.insert(
          new VariableSymbol(
            left.name,
            newValue.constructor as typeof Types.GLODataType,
            false,
          ).inheritPositionFrom(left),
        );

      const leftValue = this.scope.resolveValue(left.name);
      if (leftValue && leftValue.isArray) {
        throw new GLOError(
          node,
          `Το σύμβολο ${left.name} έχει αρχικοποιηθεί ήδη ως πίνακας. Δεν μπορεί να ξαναρχικοποιηθεί ως μεταβλητή`,
        );
      }

      Types.assertTypeEquality({
        node,
        allowPromoteLeft: false,
        left: this.scope.resolve(left.name, VariableSymbol)!.type,
        right: newValue.constructor as typeof Types.GLODataType,
      });

      this.scope.changeValue(left.name, newValue);
    } else if (left instanceof AST.ArrayAccessAST) {
      if (!this.scope.resolve(left.array.name)) {
        const arrayConstructor = Types.createGLOArray(
          newValue.constructor as typeof Types.GLODataType,
          Array(left.accessors.length).fill(Infinity),
        );
        this.scope.insert(
          new VariableSymbol(
            left.array.name,
            arrayConstructor,
            false,
            new Array(left.accessors.length).fill(
              new AST.NumberConstantAST(new Types.GLONumber(Infinity)),
            ),
          ).inheritPositionFrom(node.left),
        );

        this.scope.changeValue(left.array.name, new arrayConstructor());
      }

      const leftValue = this.scope.resolveValue(left.array.name);
      if (leftValue && !leftValue.isArray) {
        throw new GLOError(
          node,
          `Το σύμβολο ${left.array.name} έχει αρχικοποιηθεί ήδη ως μεταβλητή. Δεν μπορεί να ξαναρχικοποιηθεί ως πίνακας`,
        );
      }

      const arraySymbol = this.scope.resolve(left.array.name, VariableSymbol)!;

      const dimensionLength = arraySymbol.dimensionLength!;

      assertEquality(
        left,
        left.accessors.length,
        dimensionLength.length,
        `Ο πίνακας είναι ${dimensionLength.length}-διάστατος αλλά ${
          left.accessors.length === 1 ? 'δόθηκε' : 'δόθηκαν'
        } ${left.accessors.length} ${
          left.accessors.length === 1 ? 'δείκτης' : 'δείκτες'
        }`,
      );

      Types.assertTypeEquality({
        node: node.right,
        left: (arraySymbol.type as any).componentType,
        right: newValue.constructor as typeof Types.GLODataType,
        allowPromoteLeft: false,
        message:
          'Περίμενα μεταβλητη τύπου LEFT_TYPE αλλά έλαβα μεταβλητή τύπου RIGHT_TYPE',
      });

      const accessorValues = await Promise.all(
        left.accessors.map(node => this.visit(node)),
      );

      for (let i = 0; i < accessorValues.length; i++) {
        const accessorValue = accessorValues[i];

        Types.assertTypeEquality({
          node: left.accessors[i],
          left: Types.GLONumber,
          right: accessorValue.constructor as typeof Types.GLODataType,
          message: `Περίμενα τον δείκτη του πίνακα '${left.array.name}' να είναι τύπου LEFT_TYPE αλλά έλαβα μη συμβατό τύπο RIGHT_TYPE`,
          allowPromoteLeft: false,
        });

        assertEquality(
          left.accessors[i],
          (accessorValue as Types.GLONumber).isInteger(),
          true,
          `Περίμενα τον δείκτη του πίνακα '${left.array.name}' να είναι ακέραιος αριθμός αλλά έλαβα πραγματικό αριθμό`,
        );

        assert(
          left.accessors[i],
          accessorValue.greaterEqualsThan(new Types.GLONumber(1)),
          `Ο δείκτης του πίνακα '${left.array.name}' πρέπει να είναι μεγαλύτερος ή ίσος του 1'`,
        );

        // TODO: Fix this hack
        const lP = dimensionLength[i].start.linePosition;
        dimensionLength[i].start.linePosition = -1;
        assert(
          left.accessors[i],
          accessorValue.lessEqualsThan(await this.visit(dimensionLength[i])),
          `Ο δείκτης του πίνακα '${
            left.array.name
          }' έχει τιμή ${accessorValue.print()}, εκτός ορίων του πίνακα`,
        );
        dimensionLength[i].start.linePosition = lP;
      }

      this.scope.changeArrayValue(left.array.name, accessorValues, newValue);
    }

    return new Types.GLOVoid();
  }

  public async visitPlus(node: AST.PlusAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.add,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return left.add(right);
  }

  public async visitMinus(node: AST.MinusAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.subtract,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return left.subtract(right);
  }

  public async visitIntegerDivision(node: AST.IntegerDivisionAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    if (right.equals(new Types.GLONumber(0))) {
      throw new GLOError(node, 'Δεν μπορώ να διαιρέσω με το μηδέν');
    }

    assert(
      node,
      left.constructor.prototype.integerDivide,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return left.integerDivide(right);
  }

  public async visitRealDivision(node: AST.RealDivisionAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    if (
      right.equals(new Types.GLONumber(0)) ||
      right.equals(new Types.GLONumber(0))
    ) {
      throw new GLOError(node, 'Δεν μπορώ να διαιρέσω με το μηδέν');
    }

    assert(
      node,
      left.constructor.prototype.divide,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return left.divide(right);
  }

  public async visitMultiplication(node: AST.MultiplicationAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.multiply,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return left.multiply(right);
  }

  public async visitExponentiation(node: AST.MultiplicationAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.exponent,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return left.exponent(right);
  }

  public async visitMod(node: AST.ModAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    if (
      right.equals(new Types.GLONumber(0)) ||
      right.equals(new Types.GLONumber(0))
    ) {
      throw new GLOError(node, 'Δεν μπορώ να κάνω mod με το μηδέν');
    }

    assert(
      node,
      left.constructor.prototype.mod,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return left.mod(right);
  }

  public async visitEquals(node: AST.EqualsAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.equals,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return new Types.GLOBoolean(left.equals(right));
  }
  public async visitNotEquals(node: AST.NotEqualsAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.notEquals,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return new Types.GLOBoolean(left.notEquals(right));
  }
  public async visitGreaterThan(node: AST.GreaterThanAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.greaterThan,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return new Types.GLOBoolean(left.greaterThan(right));
  }
  public async visitLessThan(node: AST.LessThanAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.lessThan,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return new Types.GLOBoolean(left.lessThan(right));
  }
  public async visitGreaterEquals(node: AST.GreaterEqualsAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.greaterEqualsThan,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return new Types.GLOBoolean(left.greaterEqualsThan(right));
  }
  public async visitLessEquals(node: AST.LessEqualsAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertInstanceTypeEquality({ node, left, right });

    assert(
      node,
      left.constructor.prototype.lessEqualsThan,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return new Types.GLOBoolean(left.lessEqualsThan(right));
  }

  public async visitNumberConstant(node: AST.NumberConstantAST) {
    return node.value;
  }

  public async visitStringConstant(node: AST.StringConstantAST) {
    return node.value;
  }

  public async visitTrue(node: AST.TrueConstantAST) {
    return new Types.GLOBoolean(true);
  }

  public async visitFalse(node: AST.FalseConstantAST) {
    return new Types.GLOBoolean(false);
  }

  public async visitUnaryPlus(node: AST.UnaryPlusAST) {
    const target = await this.visit(node.target);

    assert(
      node,
      target.constructor.prototype.unaryPlus,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        target.constructor as typeof Types.GLODataType,
      )}`,
    );

    return target.unaryPlus();
  }

  public async visitUnaryMinus(node: AST.UnaryMinusAST) {
    const target = await this.visit(node.target);

    assert(
      node,
      target.constructor.prototype.unaryMinus,
      `Δεν μπορώ να πραγματοποιήσω την πράξη με τελεστέους τύπου ${Types.printType(
        target.constructor as typeof Types.GLODataType,
      )}`,
    );

    return target.unaryMinus();
  }

  public async visitVariable(
    node: AST.VariableAST,
    initializationCheck = true,
  ) {
    const variableValue = this.scope.resolveValue(node.name);

    if (!variableValue && initializationCheck) {
      throw new GLOError(
        node,
        `Η μεταβλητή '${node.name}' χρησιμοποιήθηκε χωρίς πρώτα να έχει αρχικοποιηθεί`,
      );
    }

    return variableValue || new Types.GLOVoid();
  }

  public async visitAlgorithm(node: AST.AlgorithmAST) {
    await this.withNewScope(
      node.name,
      async () => {
        this.scope.insert(new AlgorithmSymbol(node.name));
        await this.visitMultipleInOrder(node.children);
      },
      SymbolScopeType.Algorithm,
    );

    return new Types.GLOVoid();
  }

  public async visitIf(node: AST.IfAST) {
    const condition = await this.visit(node.condition);
    if (condition.equals(Types.GLOBoolean.true)) {
      await this.visitMultipleInOrder(node.statementList);
    } else {
      if (node.next) {
        if (Array.isArray(node.next)) {
          await this.visitMultipleInOrder(node.next);
        } else {
          await this.visit(node.next);
        }
      }
    }
    return new Types.GLOVoid();
  }

  public async visitAnd(node: AST.AndAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertEquality(
      node,
      left.constructor,
      Types.GLOBoolean,
      `Περίμενα τον αριστερό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );
    assertEquality(
      node,
      right.constructor,
      Types.GLOBoolean,
      `Περίμενα τον δεξιό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return new Types.GLOBoolean(
      left.equals(Types.GLOBoolean.true) && right.equals(Types.GLOBoolean.true),
    );
  }
  public async visitOr(node: AST.OrAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    assertEquality(
      node,
      left.constructor,
      Types.GLOBoolean,
      `Περίμενα τον αριστερό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );
    assertEquality(
      node,
      right.constructor,
      Types.GLOBoolean,
      `Περίμενα τον δεξιό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        left.constructor as typeof Types.GLODataType,
      )}`,
    );

    return new Types.GLOBoolean(
      left.equals(Types.GLOBoolean.true) || right.equals(Types.GLOBoolean.true),
    );
  }
  public async visitNot(node: AST.NotAST) {
    const target = await this.visit(node.target);

    assertEquality(
      node,
      target.constructor,
      Types.GLOBoolean,
      `Περίμενα τον αριστερό τελεστέο να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        target.constructor as typeof Types.GLODataType,
      )}`,
    );

    return target.equals(Types.GLOBoolean.true)
      ? Types.GLOBoolean.false
      : Types.GLOBoolean.true;
  }

  public async visitFor(node: AST.ForAST) {
    const counterType = this.visit(node.counter);
    assertEquality(
      node.counter,
      counterType.constructor,
      Types.GLONumber,
      `Περίμενα τον μετρητή επανάληψης να είναι τύπου ${Types.printType(
        Types.GLONumber,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        counterType.constructor as typeof Types.GLODataType,
      )}`,
    );

    const startValueType = this.visit(node.startValue);
    assertEquality(
      node.startValue,
      startValueType.constructor,
      Types.GLONumber,
      `Περίμενα την αρχική τιμή επανάληψης να είναι τύπου ${Types.printType(
        Types.GLONumber,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        startValueType.constructor as typeof Types.GLODataType,
      )}`,
    );

    const endValueType = this.visit(node.endValue);
    assertEquality(
      node.endValue,
      endValueType.constructor,
      Types.GLONumber,
      `Περίμενα την τελική επανάληψης να είναι τύπου ${Types.printType(
        Types.GLONumber,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        endValueType.constructor as typeof Types.GLODataType,
      )}`,
    );

    const stepType = this.visit(node.step);
    assertEquality(
      node.step,
      stepType.constructor,
      Types.GLONumber,
      `Περίμενα το βήμα επανάληψης να είναι τύπου ${Types.printType(
        Types.GLONumber,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        stepType.constructor as typeof Types.GLODataType,
      )}`,
    );

    await this.visitAssignment(
      new AST.AssignmentAST(node.counter, node.startValue),
    );

    if ((await this.visit(node.step)).equals(new Types.GLONumber(0))) {
      throw new GLOError(node.step, 'Απαγορεύεται επανάληψη με βήμα 0');
    } else {
      while (
        (await this.visit(node.step)).greaterThan(new Types.GLONumber(0))
          ? (await this.visit(node.counter)).lessEqualsThan(
              await this.visit(node.endValue),
            )
          : (await this.visit(node.counter)).greaterEqualsThan(
              await this.visit(node.endValue),
            )
      ) {
        await this.visitMultipleInOrder(node.statementList);

        await this.visit(
          new AST.AssignmentAST(
            node.counter,
            new AST.PlusAST(
              node.counter,
              new AST.NumberConstantAST(
                (await this.visit(node.step)) as Types.GLONumber,
              ),
            ),
          ),
        );
      }
    }

    return new Types.GLOVoid();
  }

  public async visitWhile(node: AST.WhileAST) {
    const conditionType = this.visit(node.condition);
    assertEquality(
      node.condition,
      conditionType.constructor,
      Types.GLOBoolean,
      `Περίμενα τη συνθήκη επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        conditionType.constructor as typeof Types.GLODataType,
      )}`,
    );

    while ((await this.visit(node.condition)).equals(Types.GLOBoolean.true)) {
      await this.visitMultipleInOrder(node.statementList);
    }
    return new Types.GLOVoid();
  }

  public async visitRepeat(node: AST.RepeatAST) {
    const conditionType = this.visit(node.condition);
    assertEquality(
      node.condition,
      conditionType.constructor,
      Types.GLOBoolean,
      `Περίμενα τη συνθήκη επανάληψης να είναι τύπου ${Types.printType(
        Types.GLOBoolean,
      )}, αλλά έλαβα μη συμβατό τύπο ${Types.printType(
        conditionType.constructor as typeof Types.GLODataType,
      )}`,
    );

    do {
      await this.visitMultipleInOrder(node.statementList);
    } while ((await this.visit(node.condition)).equals(Types.GLOBoolean.false));
    return new Types.GLOVoid();
  }

  public async visitSubrange(node: AST.SubrangeAST) {
    return new Types.GLOSubrange(node.left, node.right);
  }

  public async visitArray(node: AST.ArrayAST) {
    return new Types.GLOVoid();
  }

  public async visitArrayAccess(
    node: AST.ArrayAccessAST,
    initializationCheck = true,
  ) {
    const array = this.scope.resolveValue(node.array.name);

    if (!array) {
      throw new GLOError(
        node,
        `Ο πίνακας ${node.array.name} δεν έχει αρχικοποιηθεί`,
      );
    }

    if (!Types.isGLOArray(array)) {
      throw new GLOError(
        node,
        `Το σύμβολο ${node.array.name} είναι μεταβλητή και όχι πίνακας`,
      );
    }

    const dimensionLength = this.scope.resolve(node.array.name, VariableSymbol)!
      .dimensionLength!;

    assertEquality(
      node,
      node.accessors.length,
      dimensionLength.length,
      `Ο πίνακας είναι ${dimensionLength.length}-διάστατος αλλά ${
        node.accessors.length === 1 ? 'δόθηκε' : 'δόθηκαν'
      } ${node.accessors.length} ${
        node.accessors.length === 1 ? 'δείκτης' : 'δείκτες'
      }`,
    );

    const accessorValues = await Promise.all(
      node.accessors.map(node => this.visit(node)),
    );

    for (let i = 0; i < accessorValues.length; i++) {
      const accessorValue = accessorValues[i];

      Types.assertTypeEquality({
        node: node.accessors[i],
        left: Types.GLONumber,
        right: accessorValue.constructor as typeof Types.GLODataType,
        message: `Περίμενα τον δείκτη του πίνακα '${node.array.name}' να είναι τύπου LEFT_TYPE αλλά έλαβα μη συμβατό τύπο RIGHT_TYPE`,
        allowPromoteLeft: false,
      });

      assertEquality(
        node.accessors[i],
        (accessorValue as Types.GLONumber).isInteger(),
        true,
        `Περίμενα τον δείκτη του πίνακα '${node.array.name}' να είναι ακέραιος αριθμός αλλά έλαβα πραγματικό αριθμό`,
      );

      assert(
        node.accessors[i],
        accessorValue.greaterEqualsThan(new Types.GLONumber(1)),
        `Ο δείκτης του πίνακα '${node.array.name}' πρέπει να είναι μεγαλύτερος ή ίσος του 1'`,
      );

      assert(
        node.accessors[i],
        accessorValue.lessEqualsThan(await this.visit(dimensionLength[i])),
        `Ο δείκτης του πίνακα '${
          node.array.name
        }' έχει τιμή ${accessorValue.print()}, εκτός ορίων του πίνακα`,
      );
    }

    const value = array.getValue(accessorValues);

    if (!value && initializationCheck) {
      throw new GLOError(
        node,
        `Προσπάθησα να χρησιμοποιήσω το στοιχείο του πίνακα '${node.array.name}' χωρίς πρώτα αυτό να έχει αρχικοποιηθεί`,
      );
    }

    return value!;
  }

  public async visitWrite(node: AST.WriteAST) {
    const args = await Promise.all(
      node.args.map(arg => this.visit(arg)),
    ).then(args => args.map(arg => arg.print()));

    await this.options.write(...args);

    return new Types.GLOVoid();
  }

  public async visitRead(node: AST.ReadAST) {
    const argNames = node.args.map(arg =>
      arg instanceof AST.VariableAST ? arg.name : arg.array.name,
    );
    const variableTypes: (
      | typeof Types.GLODataType
      | null
    )[] = node.args.map((arg, i) =>
      this.scope.resolve(argNames[i])
        ? arg instanceof AST.VariableAST
          ? (this.scope.resolve(argNames[i]) as VariableSymbol).type
          : (((this.scope.resolve(argNames[i]) as VariableSymbol).type as any)
              .componentType as typeof Types.GLODataType)
        : null,
    );

    const values = [];

    for (let i = 0; i < node.args.length; i++) {
      const argNode = node.args[i];

      const expectedType = variableTypes[i];
      const name = argNames[i];

      const leftSymbol = this.scope.resolve(name)!;
      if (!(leftSymbol instanceof VariableSymbol)) {
        throw new GLOError(
          argNode,
          `Το σύμβολο ${name} έχει χρησιμοποιηθεί ήδη ως ${leftSymbol.print()}.`,
        );
      }

      const reading = await this.options.read(argNode);

      if (expectedType === Types.GLONumber) {
        if (/^[+-]?\d+(\.\d+)*$/.test(reading)) {
          values.push(new Types.GLONumber(parseFloat(reading)));
        } else if (/^[+-]?\d+$/.test(reading)) {
          values.push(new Types.GLONumber(parseInt(reading)));
        } else {
          throw new GLOError(
            argNode,
            `Περίμενα να διαβάσω νούμερο στη μεταβλητή ${name} αλλά έλαβα μη έγκυρο νούμερο '${reading}'`,
          );
        }
      } else if (expectedType === Types.GLOString) {
        values.push(new Types.GLOString(reading));
      } else if (!expectedType) {
        if (/^[+-]?\d+(\.\d+)*$/.test(reading)) {
          values.push(new Types.GLONumber(parseFloat(reading)));
          variableTypes[i] = Types.GLONumber;
        } else if (/^[+-]?\d+$/.test(reading)) {
          values.push(new Types.GLONumber(parseInt(reading)));
          variableTypes[i] = Types.GLONumber;
        } else {
          values.push(new Types.GLOString(reading));
          variableTypes[i] = Types.GLOString;
        }
      } else {
        throw new GLOError(
          argNode,
          `Μπορώ να διαβάσω μόνο μεταβλητές τύπου ${Types.printType(
            Types.GLONumber,
          )} ή ${Types.printType(
            Types.GLOString,
          )}, αλλά έλαβα μεταβλητή τύπου ${Types.printType(expectedType)}`,
        );
      }
    }

    for (let i = 0; i < node.args.length; i++) {
      const arg = node.args[i];
      const value = values[i];

      if (arg instanceof AST.VariableAST) {
        if (!this.scope.resolve(arg.name))
          this.scope.insert(
            new VariableSymbol(arg.name, variableTypes[i]!, false),
          );
        this.scope.changeValue(arg.name, value);
      } else {
        if (!this.scope.resolveValue(arg.array.name)) {
          const arrayConstructor = Types.createGLOArray(
            variableTypes[i]!,
            Array(arg.accessors.length).fill(Infinity),
          );
          this.scope.insert(
            new VariableSymbol(
              arg.array.name,
              arrayConstructor,
              false,
              new Array(arg.accessors.length).fill(
                new AST.NumberConstantAST(new Types.GLONumber(Infinity)),
              ),
            ),
          );

          this.scope.changeValue(arg.array.name, new arrayConstructor());
        }
        this.scope.changeArrayValue(
          arg.array.name,
          await Promise.all(arg.accessors.map(arg => this.visit(arg))),
          value,
        );
      }
    }

    return new Types.GLOVoid();
  }

  public async visitFunctionCall(node: AST.FunctionCallAST) {
    const args = await Promise.all(node.args.map(arg => this.visit(arg)));
    const func = this.scope.resolveValue<Types.GLOFunction>(node.name);

    if (!func) {
      throw new GLOError(node, `Δεν υπάρχει συνάρτηση με όνομα ${node.name}`);
    }

    await func.call(args, node.args);

    const returnValue = this.scope.resolveValue<Types.GLOFunction>(node.name)!
      .returnValue;

    if (!returnValue) {
      throw new GLOError(
        node,
        `Η συνάρτηση '${node.name}' δεν επιστρέφει κάποια τιμή`,
      );
    }

    return returnValue;
  }

  public async visitSwap(node: AST.SwapAST) {
    const leftValue = await (node.left instanceof AST.VariableAST
      ? this.visitVariable(node.left)
      : this.visitArrayAccess(node.left));
    const rightValue = await (node.right instanceof AST.VariableAST
      ? this.visitVariable(node.right)
      : this.visitArrayAccess(node.right));

    assertInstanceTypeEquality({
      node,
      left: leftValue,
      right: rightValue,
      message: `Δεν μπορώ να αντιμεταθέσω μεταβλητές μη συμβατού τύπου LEFT_TYPE και RIGHT_TYPE`,
    });

    // TODO: Add this function to SymbolScope??
    const changeValue = async (
      node: AST.VariableAST | AST.ArrayAccessAST,
      value: Types.GLODataType,
    ) =>
      node instanceof AST.VariableAST
        ? this.scope.changeValue(node.name, value)
        : this.scope.changeArrayValue(
            node.array.name,
            await Promise.all(
              node.accessors.map(accessor => this.visit(accessor)),
            ),
            value,
          );

    changeValue(node.left, rightValue);
    changeValue(node.right, leftValue);

    return new Types.GLOVoid();
  }

  public async defaultVisit(node: AST.AST) {
    return new Types.GLOVoid();
  }

  public async run() {
    await this.visit(this.ast);
    return;
  }
}
