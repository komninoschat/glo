import * as AST from '@glossa-glo/ast';
import {
  BaseSymbolScope,
  LocalSymbolScope,
  SymbolScope,
  ProgramSymbol,
  SymbolScopeType,
  VariableSymbol,
} from '@glossa-glo/symbol';
import * as GLOSymbol from '@glossa-glo/symbol';
import GLOError from '@glossa-glo/error';
import { ArrayAST, VariableAST } from '@glossa-glo/ast';

export default class SymbolBuilder extends AST.GlossaASTVisitorWithDefault<GLOSymbol.GLOSymbol | void> {
  private currentScope: SymbolScope;
  private insideFunction = false;

  constructor(protected readonly ast: AST.AST, baseScope: BaseSymbolScope) {
    super();
    this.currentScope = baseScope;
  }

  public visitVariable(
    node: AST.VariableAST,
    assignee = false,
  ): GLOSymbol.GLOSymbol {
    const variableValue = this.currentScope.resolve(node.name);

    if (variableValue instanceof GLOSymbol.VariableSymbol) {
      return variableValue;
    } else if (
      variableValue instanceof GLOSymbol.FunctionSymbol &&
      this.currentScope.type === SymbolScopeType.Function && // Is inside function
      this.currentScope.nameEquals(node.name) && // Variable name matches function name
      assignee // Variable the left side of an assignment expression
    ) {
      return variableValue;
    } else if (variableValue) {
      throw new GLOError(
        node,
        `Το αναγνωριστικό '${
          node.name
        }' τύπου ${variableValue.print()} δεν μπορεί να χρησιμοποιηθεί μέσα σε έκφραση`,
      );
    } else {
      throw new GLOError(
        node,
        `Η μεταβλητή ${node.name} χρησιμοποιήθηκε χωρίς πρώτα να έχει οριστεί`,
      );
    }
  }

  public visitProgram(node: AST.ProgramAST): void {
    this.currentScope = new LocalSymbolScope(
      node.name,
      SymbolScopeType.Program,
      this.currentScope,
    );
    this.currentScope.insert(new ProgramSymbol(node.name));
    this.visitMultiple(node.declarations);
    this.visitMultiple(node.statementList);
    this.currentScope = this.currentScope.getParent()!;
  }

  public visitVariableDeclaration(
    node: AST.VariableDeclarationAST,
  ): GLOSymbol.VariableSymbol {
    let symbol: GLOSymbol.VariableSymbol;

    if (node.type.dataType) {
      symbol = new GLOSymbol.VariableSymbol(
        node.variable.name,
        node.type.dataType,
        false,
        node.type instanceof AST.ArrayAST
          ? node.type.dimensionLength
          : undefined,
      ).inheritPositionFrom(node.variable);
    } else
      throw new GLOError(
        node.type,
        `Program error: Unknown data type ${node.type.constructor.name}`,
      );

    this.currentScope.insert(symbol);
    return symbol;
  }

  public visitConstantDeclaration(
    node: AST.ConstantDeclarationAST,
  ): GLOSymbol.VariableSymbol {
    const symbol = new GLOSymbol.VariableSymbol(
      node.variable.name,
      node.type!, // Guaranteed by SimplifyConstants
      true,
    ).inheritPositionFrom(node.variable);

    this.currentScope.insert(symbol);
    this.currentScope.changeValue(
      node.variable.name,
      node.value!, // Guaranteed by SimplifyConstants
    );

    return symbol;
  }

  public visitProcedureDeclaration(node: AST.ProcedureDeclarationAST): void {
    this.currentScope = new LocalSymbolScope(
      node.name.name,
      SymbolScopeType.Procedure,
      this.currentScope,
    );

    const procedureVariables = [
      ...node.variableDeclarations.map((arg) =>
        this.visitVariableDeclaration(arg),
      ),
      ...node.constantDeclarations.map((arg) =>
        this.visitConstantDeclaration(arg),
      ),
    ];

    const procedureVariableNames = procedureVariables
      .filter((v) => !v.isConstant)
      .map((v) => v.name);
    node.args.forEach((arg) => {
      if (!procedureVariableNames.includes(arg.name)) {
        throw new GLOError(
          arg,
          `Η παράμετρος ${arg.name} δεν ορίζεται στο τμήμα δηλώσεων της διαδικασίας`,
        );
      }
    });

    const argNames = node.args.map((arg) => arg.name);

    const argSymbols = argNames.map(
      (argName) =>
        procedureVariables.find((variable) => variable.name === argName)!,
    );

    this.currentScope
      .getParent()!
      .insert(
        new GLOSymbol.ProcedureSymbol(
          node.name.name,
          argSymbols,
        ).inheritPositionFrom(node.name),
      );

    this.visitMultiple(node.statementList);
    this.currentScope = this.currentScope.getParent()!;
  }

  public visitFunctionDeclaration(node: AST.FunctionDeclarationAST): void {
    this.currentScope = new LocalSymbolScope(
      node.name.name,
      SymbolScopeType.Function,
      this.currentScope,
    );

    const functionVariables = [
      ...node.variableDeclarations.map((arg) =>
        this.visitVariableDeclaration(arg),
      ),
      ...node.constantDeclarations.map((arg) =>
        this.visitConstantDeclaration(arg),
      ),
    ];

    const functionVariableNames = functionVariables
      .filter((v) => !v.isConstant)
      .map((v) => v.name);
    node.args.forEach((arg) => {
      if (!functionVariableNames.includes(arg.name)) {
        throw new GLOError(
          arg,
          `Η παράμετρος ${arg.name} δεν ορίζεται στο τμήμα δηλώσεων της συνάρτησης`,
        );
      }
    });

    const argNames = node.args.map((arg) => arg.name);

    const argSymbols = argNames.map(
      (argName) =>
        functionVariables.find((variable) => variable.name === argName)!,
    );

    this.currentScope
      .getParent()!
      .insert(
        new GLOSymbol.FunctionSymbol(
          node.name.name,
          argSymbols,
          node.returnType.dataType,
        ).inheritPositionFrom(node.name),
      );

    this.insideFunction = true;
    this.visitMultiple(node.statementList);
    this.insideFunction = false;

    this.currentScope = this.currentScope.getParent()!;
  }

  public visitFunctionCall(node: AST.FunctionCallAST) {
    this.visitMultiple(node.args);

    const symbol = this.currentScope.resolve(node.name);

    if (!symbol) {
      throw new GLOError(
        node,
        `Δεν έχει οριστεί συνάρτηση με όνομα ${node.name}`,
      );
    } else if (symbol instanceof GLOSymbol.ProcedureSymbol) {
      throw new GLOError(
        node,
        `Η διαδικασία '${node.name}' μπορεί να καλεστεί μόνο με την εντολή ΚΑΛΕΣΕ και όχι μεσα σε μια έκφραση`,
      );
    } else if (symbol instanceof GLOSymbol.VariableSymbol) {
      throw new GLOError(
        node,
        `Δεν μπορώ να καλέσω την μεταβλητή '${node.name}'`,
      );
    } else if (!(symbol instanceof GLOSymbol.FunctionSymbol)) {
      throw new GLOError(
        node,
        `Δεν μπορώ να καλέσω το αναγνωριστικό '${
          node.name
        }' τύπου ${symbol.print()} μέσα σε έκφραση`,
      );
    } else if (node.args.length != symbol.args.length) {
      throw new GLOError(
        node,
        `Περίμενα ${symbol.args.length} ${
          symbol.args.length === 1 ? 'παράμετρο' : 'παραμέτρους'
        } συνάρτησης αλλά έλαβα ${node.args.length}`,
      );
    }
  }

  public visitProcedureCall(node: AST.ProcedureCallAST) {
    if (this.insideFunction) {
      throw new GLOError(
        node,
        'Δεν επιτρέπεται κάλεσμα διαδικασίας μέσα σε συνάρτηση',
      );
    }

    this.visitMultiple(node.args);

    const symbol = this.currentScope.resolve(node.name);

    if (!symbol) {
      throw new GLOError(
        node,
        `Δεν έχει οριστεί διαδικασία με όνομα ${node.name}`,
      );
    } else if (!(symbol instanceof GLOSymbol.ProcedureSymbol)) {
      throw new GLOError(
        node,
        `Η εντολή ΚΑΛΕΣΕ μπορεί να χρησιμοποιηθεί μόνο με παράμετρο μια διαδικασία, αλλά έλαβα παράμετρο '${
          node.name
        }' τύπου ${symbol.print()}`,
      );
    } else if (node.args.length != symbol.args.length) {
      throw new GLOError(
        node,
        `Περίμενα ${symbol.args.length} ${
          symbol.args.length === 1 ? 'παράμετρο' : 'παραμέτρους'
        } διαδικασίας αλλά έλαβα ${node.args.length}`,
      );
    }
  }

  public visitAssignment(node: AST.AssignmentAST): void {
    if (node.left instanceof VariableAST) {
      const symbol = this.visitVariable(node.left, true);

      if (symbol instanceof VariableSymbol && symbol.isConstant) {
        throw new GLOError(node.left, 'Δεν μπορώ να αναθέσω τιμή σε σταθερά');
      }
    } else {
      this.visit(node.left);
    }
    this.visit(node.right);
  }

  public visitRead(node: AST.ReadAST) {
    node.children.forEach((child) => {
      const symbol = this.visit(child);

      if (symbol instanceof VariableSymbol && symbol.isConstant) {
        throw new GLOError(child, 'Δεν μπορώ να διαβάσω σταθερή τιμή');
      }
    });
  }

  public defaultVisit(node: AST.AST) {
    this.visitMultiple(node.children);
  }

  public run() {
    return this.visit(this.ast);
  }
}
