import * as Types from '@glossa-glo/data-types';
import * as AST from '@glossa-glo/ast';
import {
  SymbolScope,
  BaseSymbolScope,
  LocalSymbolScope,
  SymbolScopeType,
  VariableSymbol,
} from '@glossa-glo/symbol';
import { IntegerConstantAST, VariableAST } from '@glossa-glo/ast';
import GLOError, {
  assertEquality,
  assert,
  DebugInfoProvider,
} from '@glossa-glo/error';
import cloneDeep from 'clone-deep';

export class Interpreter extends AST.GlossaAsyncASTVisitorWithDefault<
  Types.GLODataType
> {
  public scope: SymbolScope;

  constructor(
    protected readonly ast: AST.AST,
    baseScope: BaseSymbolScope,
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
  ) {
    const scope = this.scope.children.get(name);

    if (!scope)
      throw new Error(
        `Program error: Scope with name ${name} does not exist on scope ${this.scope.name}`,
      );

    this.scope = scope;
    const result = await fn(scope);
    this.scope = this.scope.getParent()!;
    return result;
  }

  public async visitAssignment(node: AST.AssignmentAST) {
    const left = node.left;
    const newValue = await this.visit(node.right);

    if (left instanceof AST.VariableAST) {
      if (
        this.scope.type === SymbolScopeType.Function && // Is in function
        this.scope.nameEquals(left.name) // Variable name matches function name
      ) {
        this.scope.changeFunctionReturnType(left.name, newValue);
      } else this.scope.changeValue(left.name, newValue);
    } else if (left instanceof AST.ArrayAccessAST) {
      const dimensionLength = this.scope.resolve(
        left.array.name,
        VariableSymbol,
      )!.dimensionLength!;

      const accessorValues = await Promise.all(
        left.accessors.map(node => this.visit(node)),
      );

      for (let i = 0; i < accessorValues.length; i++) {
        const accessorValue = accessorValues[i];

        assert(
          left.accessors[i],
          accessorValue.greaterEqualsThan(new Types.GLOInteger(1)),
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

    return left.add(right);
  }

  public async visitMinus(node: AST.MinusAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return left.subtract(right);
  }

  public async visitIntegerDivision(node: AST.IntegerDivisionAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    if (right.equals(new Types.GLOInteger(0))) {
      throw new GLOError(node, 'Δεν μπορώ να διαιρέσω με το μηδέν');
    }

    return left.integerDivide(right);
  }

  public async visitRealDivision(node: AST.RealDivisionAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    if (
      right.equals(new Types.GLOInteger(0)) ||
      right.equals(new Types.GLOReal(0))
    ) {
      throw new GLOError(node, 'Δεν μπορώ να διαιρέσω με το μηδέν');
    }

    return left.divide(right);
  }

  public async visitMultiplication(node: AST.MultiplicationAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return left.multiply(right);
  }

  public async visitExponentiation(node: AST.MultiplicationAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return left.exponent(right);
  }

  public async visitMod(node: AST.ModAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    if (
      right.equals(new Types.GLOInteger(0)) ||
      right.equals(new Types.GLOReal(0))
    ) {
      throw new GLOError(node, 'Δεν μπορώ να κάνω mod με το μηδέν');
    }

    return left.mod(right);
  }

  public async visitEquals(node: AST.EqualsAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return new Types.GLOBoolean(left.equals(right));
  }
  public async visitNotEquals(node: AST.NotEqualsAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return new Types.GLOBoolean(left.notEquals(right));
  }
  public async visitGreaterThan(node: AST.GreaterThanAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return new Types.GLOBoolean(left.greaterThan(right));
  }
  public async visitLessThan(node: AST.LessThanAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return new Types.GLOBoolean(left.lessThan(right));
  }
  public async visitGreaterEquals(node: AST.GreaterEqualsAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return new Types.GLOBoolean(left.greaterEqualsThan(right));
  }
  public async visitLessEquals(node: AST.LessEqualsAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return new Types.GLOBoolean(left.lessEqualsThan(right));
  }

  public async visitIntegerConstant(node: AST.IntegerConstantAST) {
    return node.value;
  }

  public async visitRealConstant(node: AST.RealConstantAST) {
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

    return target.unaryPlus();
  }

  public async visitUnaryMinus(node: AST.UnaryMinusAST) {
    const target = await this.visit(node.target);

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

  public async visitProgram(node: AST.ProgramAST) {
    return await this.withNewScope(node.name, async () => {
      await this.visitMultipleInOrder(node.children);

      return new Types.GLOVoid();
    });
  }

  public async visitProcedureDeclaration(node: AST.ProcedureDeclarationAST) {
    const procedure = new Types.GLOProcedure(async (args, rewrite) => {
      await this.withNewScope(node.name.name, async scope => {
        const symbol = this.scope.resolve(node.name.name)!; // Guaranteed by TypeChecker
        if (!this.scope.has(symbol)) {
          // Allow recursion
          scope.insert(symbol);
          scope.changeValue(node.name.name, procedure);
          new LocalSymbolScope(
            node.name.name,
            SymbolScopeType.Procedure,
            this.scope,
          );
        }

        // Copy in parameter values
        node.args
          // Filter uninitialized variables
          .filter((arg, i) => !(args[i] instanceof Types.GLOVoid))
          // Filter unitialized array indices
          .map(arg => arg.name)
          .forEach((argName, i) => {
            scope.changeValue(argName, cloneDeep(args[i]));
          });

        await this.visitMultipleInOrder(node.constantDeclarations);
        await this.visitMultipleInOrder(node.variableDeclarations);
        await this.visitMultipleInOrder(node.statementList);

        // Copy out parameter values in parent scope
        for (let i = node.args.length - 1; i >= 0; i--) {
          const arg = node.args[i];
          const currentRewrite = rewrite[i];

          if (currentRewrite) {
            if (currentRewrite.accessors) {
              scope
                .getParent()!
                .changeArrayValue(
                  currentRewrite.name,
                  currentRewrite.accessors,
                  scope.resolveValue(arg.name)!,
                );
            } else {
              scope
                .getParent()!
                .changeValue(
                  currentRewrite.name,
                  scope.resolveValue(arg.name)!,
                );
            }
          }
        }
      });
    });

    this.scope.changeValue(node.name.name, procedure);
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

    return new Types.GLOBoolean(
      left.equals(Types.GLOBoolean.true) && right.equals(Types.GLOBoolean.true),
    );
  }
  public async visitOr(node: AST.OrAST) {
    const left = await this.visit(node.left);
    const right = await this.visit(node.right);

    return new Types.GLOBoolean(
      left.equals(Types.GLOBoolean.true) || right.equals(Types.GLOBoolean.true),
    );
  }
  public async visitNot(node: AST.NotAST) {
    const target = await this.visit(node.target);

    return target.equals(Types.GLOBoolean.true)
      ? Types.GLOBoolean.false
      : Types.GLOBoolean.true;
  }

  public async visitFunctionCall(node: AST.FunctionCallAST) {
    const args = await Promise.all(node.args.map(arg => this.visit(arg)));
    const func = this.scope.resolveValue<Types.GLOFunction>(node.name)!;

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

  public async visitProcedureCall(node: AST.ProcedureCallAST) {
    const args = await Promise.all(
      node.args.map(arg => {
        if (arg instanceof AST.VariableAST) {
          return this.visitVariable(arg, false);
        } else if (arg instanceof AST.ArrayAccessAST) {
          return this.visitArrayAccess(arg, false);
        } else {
          return this.visit(arg);
        }
      }),
    );
    const procedure = this.scope.resolveValue<Types.GLOProcedure>(node.name)!;

    await procedure.call(
      args,
      await Promise.all(
        node.args.map(async arg => {
          if (arg instanceof AST.VariableAST) {
            return !(this.scope.resolve(arg.name) as VariableSymbol).isConstant
              ? {
                  name: arg.name,
                  accessors: null,
                }
              : false;
          } else if (arg instanceof AST.ArrayAccessAST) {
            return {
              name: arg.array.name,
              accessors: await Promise.all(
                arg.accessors.map(arg => this.visit(arg)),
              ),
            };
          } else return false;
        }),
      ),
    );

    return new Types.GLOVoid();
  }

  public async visitFor(node: AST.ForAST) {
    await this.visitAssignment(
      new AST.AssignmentAST(node.counter, node.startValue),
    );

    if ((await this.visit(node.step)).equals(new Types.GLOInteger(0))) {
      throw new GLOError(node.step, 'Απαγορεύεται επανάληψη με βήμα 0');
    } else {
      while (
        (await this.visit(node.step)).greaterThan(new Types.GLOInteger(0))
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
              new IntegerConstantAST(
                (await this.visit(
                  node.step,
                )) as Types.GLOInteger /* Guaranteed by TypeChecker */,
              ),
            ),
          ),
        );
      }
    }

    return new Types.GLOVoid();
  }

  public async visitWhile(node: AST.WhileAST) {
    while ((await this.visit(node.condition)).equals(Types.GLOBoolean.true)) {
      await this.visitMultipleInOrder(node.statementList);
    }
    return new Types.GLOVoid();
  }

  public async visitRepeat(node: AST.RepeatAST) {
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
        `Program error: Array accessed without being initialized`,
      );
    }

    if (!Types.isGLOArray(array)) {
      throw new GLOError(
        node,
        `Program error: Expected array access variable to be array`,
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

      assert(
        node.accessors[i],
        accessorValue.greaterEqualsThan(new Types.GLOInteger(1)),
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

  public async visitFunctionDeclaration(node: AST.FunctionDeclarationAST) {
    const func = new Types.GLOFunction(async args => {
      await this.withNewScope(node.name.name, async scope => {
        const symbol = this.scope.resolve(node.name.name)!; // Guaranteed by TypeChecker
        if (!this.scope.has(symbol)) {
          // Allow recursion
          scope.insert(symbol);
          scope.changeValue(node.name.name, func);
          new LocalSymbolScope(
            node.name.name,
            SymbolScopeType.Function,
            this.scope,
          );
        }

        node.args
          .map(arg => arg.name)
          .forEach((argName, i) => {
            scope.changeValue(argName, args[i]);
          });

        await this.visitMultipleInOrder(node.constantDeclarations);
        await this.visitMultipleInOrder(node.variableDeclarations);
        await this.visitMultipleInOrder(node.statementList);
      });
    });

    this.scope.changeValue(node.name.name, func);

    return new Types.GLOVoid();
  }

  public async visitWrite(node: AST.WriteAST) {
    const args = await Promise.all(
      node.args.map(arg => this.visit(arg)),
    ).then(args => args.map(arg => arg.print()));

    await this.options.write(...args);

    return new Types.GLOVoid();
  }

  public async visitRead(node: AST.ReadAST) {
    const noInfoError = new DebugInfoProvider([
      [-1, -1],
      [-1, -1],
    ]);

    const argNames = node.args.map(arg =>
      arg instanceof VariableAST ? arg.name : arg.array.name,
    );
    const variableTypes = node.args.map((arg, i) =>
      arg instanceof VariableAST
        ? (this.scope.resolve(argNames[i]) as VariableSymbol).type
        : (((this.scope.resolve(argNames[i]) as VariableSymbol).type as any)
            .componentType as typeof Types.GLODataType),
    );

    const values = [];

    for (let i = 0; i < node.args.length; i++) {
      const argNode = node.args[i];

      const expectedType = variableTypes[i];
      const name = argNames[i];

      const reading = await this.options.read(argNode);

      if (expectedType === Types.GLOReal) {
        if (/^[+-]?\d+(\.\d+)*$/.test(reading)) {
          values.push(new Types.GLOReal(parseFloat(reading)));
        } else {
          throw new GLOError(
            noInfoError,
            `Περίμενα να διαβάσω πραγματική τιμή στη μεταβλητή ${name} αλλά έλαβα μη έγκυρη πραγματική τιμή '${reading}'`,
          );
        }
      } else if (expectedType === Types.GLOInteger) {
        if (/^[+-]?\d+$/.test(reading)) {
          values.push(new Types.GLOInteger(parseInt(reading)));
        } else {
          throw new GLOError(
            noInfoError,
            `Περίμενα να διαβάσω ακέραια τιμή στη μεταβλητή ${name} αλλά έλαβα μη έγκυρη ακέραια τιμή '${reading}'`,
          );
        }
      } else if (expectedType === Types.GLOString) {
        values.push(new Types.GLOString(reading));
      } else {
        throw new Error(
          `Invalid expected read type ${expectedType.constructor.name}`,
        );
      }
    }

    for (let i = 0; i < node.args.length; i++) {
      const arg = node.args[i];
      const value = values[i];

      if (arg instanceof AST.VariableAST) {
        this.scope.changeValue(arg.name, value);
      } else {
        this.scope.changeArrayValue(
          arg.array.name,
          await Promise.all(arg.accessors.map(arg => this.visit(arg))),
          value,
        );
      }
    }

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
