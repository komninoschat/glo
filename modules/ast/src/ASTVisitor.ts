import * as AST from './AST';
import GLOError from '@glossa-glo/error';

interface ASTVisitor<T = unknown> {
  visitAssignment(node: AST.AssignmentAST): T;
  visitEmpty(node: AST.EmptyAST): T;
  visitInteger(node: AST.IntegerAST): T;
  visitIntegerConstant(node: AST.IntegerConstantAST): T;
  visitIntegerDivision(node: AST.IntegerDivisionAST): T;
  visitMinus(node: AST.MinusAST): T;
  visitMultiplication(node: AST.MultiplicationAST): T;
  visitPlus(node: AST.PlusAST): T;
  visitProcedureDeclaration(node: AST.ProcedureDeclarationAST): T;
  visitProgram(node: AST.ProgramAST): T;
  visitReal(node: AST.RealAST): T;
  visitRealConstant(node: AST.RealConstantAST): T;
  visitRealDivision(node: AST.RealDivisionAST): T;
  visitUnaryMinus(node: AST.UnaryMinusAST): T;
  visitUnaryPlus(node: AST.UnaryPlusAST): T;
  visitVariable(node: AST.VariableAST): T;
  visitVariableDeclaration(node: AST.VariableDeclarationAST): T;
  visitMod(node: AST.ModAST): T;
  visitTrue(node: AST.TrueConstantAST): T;
  visitFalse(node: AST.FalseConstantAST): T;
  visitEquals(node: AST.EqualsAST): T;
  visitNotEquals(node: AST.NotEqualsAST): T;
  visitGreaterThan(node: AST.GreaterThanAST): T;
  visitLessThan(node: AST.LessThanAST): T;
  visitGreaterEquals(node: AST.GreaterEqualsAST): T;
  visitLessEquals(node: AST.LessEqualsAST): T;
  visitIf(node: AST.IfAST): T;
  visitString(node: AST.StringAST): T;
  visitStringConstant(node: AST.StringConstantAST): T;
  visitAnd(node: AST.AndAST): T;
  visitOr(node: AST.OrAST): T;
  visitNot(node: AST.NotAST): T;
  visitFunctionCall(node: AST.FunctionCallAST): T;
  visitProcedureCall(node: AST.ProcedureCallAST): T;
  visitFor(node: AST.ForAST): T;
  visitWhile(node: AST.WhileAST): T;
  visitRepeat(node: AST.RepeatAST): T;
  visitSubrange(node: AST.SubrangeAST): T;
  visitBoolean(node: AST.BooleanAST): T;
  visitArray(node: AST.ArrayAST): T;
  visitArrayAccess(node: AST.ArrayAccessAST): T;
  visitFunctionDeclaration(node: AST.FunctionDeclarationAST): T;
  visitRead(node: AST.ReadAST): T;
  visitWrite(node: AST.WriteAST): T;
  visitExponentiation(node: AST.ExponentiationAST): T;
  visitConstantDeclaration(node: AST.ConstantDeclarationAST): T;
}

abstract class ASTVisitor<T = unknown> {
  public visit(node: AST.AST): T {
    if (node instanceof AST.AssignmentAST) {
      return this.visitAssignment(node);
    } else if (node instanceof AST.BooleanAST) {
      return this.visitBoolean(node);
    } else if (node instanceof AST.EmptyAST) {
      return this.visitEmpty(node);
    } else if (node instanceof AST.IntegerAST) {
      return this.visitInteger(node);
    } else if (node instanceof AST.IntegerConstantAST) {
      return this.visitIntegerConstant(node);
    } else if (node instanceof AST.IntegerDivisionAST) {
      return this.visitIntegerDivision(node);
    } else if (node instanceof AST.MinusAST) {
      return this.visitMinus(node);
    } else if (node instanceof AST.MultiplicationAST) {
      return this.visitMultiplication(node);
    } else if (node instanceof AST.PlusAST) {
      return this.visitPlus(node);
    } else if (node instanceof AST.ProcedureDeclarationAST) {
      return this.visitProcedureDeclaration(node);
    } else if (node instanceof AST.ProgramAST) {
      return this.visitProgram(node);
    } else if (node instanceof AST.RealAST) {
      return this.visitReal(node);
    } else if (node instanceof AST.RealConstantAST) {
      return this.visitRealConstant(node);
    } else if (node instanceof AST.RealDivisionAST) {
      return this.visitRealDivision(node);
    } else if (node instanceof AST.UnaryMinusAST) {
      return this.visitUnaryMinus(node);
    } else if (node instanceof AST.UnaryPlusAST) {
      return this.visitUnaryPlus(node);
    } else if (node instanceof AST.VariableAST) {
      return this.visitVariable(node);
    } else if (node instanceof AST.VariableDeclarationAST) {
      return this.visitVariableDeclaration(node);
    } else if (node instanceof AST.ModAST) {
      return this.visitMod(node);
    } else if (node instanceof AST.TrueConstantAST) {
      return this.visitTrue(node);
    } else if (node instanceof AST.FalseConstantAST) {
      return this.visitFalse(node);
    } else if (node instanceof AST.EqualsAST) {
      return this.visitEquals(node);
    } else if (node instanceof AST.NotEqualsAST) {
      return this.visitNotEquals(node);
    } else if (node instanceof AST.GreaterThanAST) {
      return this.visitGreaterThan(node);
    } else if (node instanceof AST.LessThanAST) {
      return this.visitLessThan(node);
    } else if (node instanceof AST.GreaterEqualsAST) {
      return this.visitGreaterEquals(node);
    } else if (node instanceof AST.LessEqualsAST) {
      return this.visitLessEquals(node);
    } else if (node instanceof AST.IfAST) {
      return this.visitIf(node);
    } else if (node instanceof AST.StringAST) {
      return this.visitString(node);
    } else if (node instanceof AST.StringConstantAST) {
      return this.visitStringConstant(node);
    } else if (node instanceof AST.AndAST) {
      return this.visitAnd(node);
    } else if (node instanceof AST.OrAST) {
      return this.visitOr(node);
    } else if (node instanceof AST.NotAST) {
      return this.visitNot(node);
    } else if (node instanceof AST.FunctionCallAST) {
      return this.visitFunctionCall(node);
    } else if (node instanceof AST.ProcedureCallAST) {
      return this.visitProcedureCall(node);
    } else if (node instanceof AST.ForAST) {
      return this.visitFor(node);
    } else if (node instanceof AST.WhileAST) {
      return this.visitWhile(node);
    } else if (node instanceof AST.RepeatAST) {
      return this.visitRepeat(node);
    } else if (node instanceof AST.SubrangeAST) {
      return this.visitSubrange(node);
    } else if (node instanceof AST.ArrayAST) {
      return this.visitArray(node);
    } else if (node instanceof AST.ArrayAccessAST) {
      return this.visitArrayAccess(node);
    } else if (node instanceof AST.FunctionDeclarationAST) {
      return this.visitFunctionDeclaration(node);
    } else if (node instanceof AST.ReadAST) {
      return this.visitRead(node);
    } else if (node instanceof AST.WriteAST) {
      return this.visitWrite(node);
    } else if (node instanceof AST.ExponentiationAST) {
      return this.visitExponentiation(node);
    } else if (node instanceof AST.ConstantDeclarationAST) {
      return this.visitConstantDeclaration(node);
    } else {
      throw new GLOError(
        node,
        `Program error: Unknown or not implemented AST node type on visitor ${node.constructor.name}`,
      );
    }
  }
}

export default ASTVisitor;
