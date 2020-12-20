import * as AST from './AST';
import GLOError from '@glossa-glo/error';

abstract class ASTVisitor<T = unknown> {
  public abstract visitAssignment(node: AST.AssignmentAST): T;
  public abstract visitEmpty(node: AST.EmptyAST): T;
  public abstract visitInteger(node: AST.IntegerAST): T;
  public abstract visitIntegerConstant(node: AST.IntegerConstantAST): T;
  public abstract visitIntegerDivision(node: AST.IntegerDivisionAST): T;
  public abstract visitMinus(node: AST.MinusAST): T;
  public abstract visitMultiplication(node: AST.MultiplicationAST): T;
  public abstract visitPlus(node: AST.PlusAST): T;
  public abstract visitProcedureDeclaration(
    node: AST.ProcedureDeclarationAST,
  ): T;
  public abstract visitProgram(node: AST.ProgramAST): T;
  public abstract visitReal(node: AST.RealAST): T;
  public abstract visitRealConstant(node: AST.RealConstantAST): T;
  public abstract visitRealDivision(node: AST.RealDivisionAST): T;
  public abstract visitUnaryMinus(node: AST.UnaryMinusAST): T;
  public abstract visitUnaryPlus(node: AST.UnaryPlusAST): T;
  public abstract visitVariable(node: AST.VariableAST): T;
  public abstract visitVariableDeclaration(node: AST.VariableDeclarationAST): T;
  public abstract visitMod(node: AST.ModAST): T;
  public abstract visitTrue(node: AST.TrueConstantAST): T;
  public abstract visitFalse(node: AST.FalseConstantAST): T;
  public abstract visitEquals(node: AST.EqualsAST): T;
  public abstract visitNotEquals(node: AST.NotEqualsAST): T;
  public abstract visitGreaterThan(node: AST.GreaterThanAST): T;
  public abstract visitLessThan(node: AST.LessThanAST): T;
  public abstract visitGreaterEquals(node: AST.GreaterEqualsAST): T;
  public abstract visitLessEquals(node: AST.LessEqualsAST): T;
  public abstract visitIf(node: AST.IfAST): T;
  public abstract visitString(node: AST.StringAST): T;
  public abstract visitStringConstant(node: AST.StringConstantAST): T;
  public abstract visitAnd(node: AST.AndAST): T;
  public abstract visitOr(node: AST.OrAST): T;
  public abstract visitNot(node: AST.NotAST): T;
  public abstract visitFunctionCall(node: AST.FunctionCallAST): T;
  public abstract visitProcedureCall(node: AST.ProcedureCallAST): T;
  public abstract visitFor(node: AST.ForAST): T;
  public abstract visitWhile(node: AST.WhileAST): T;
  public abstract visitRepeat(node: AST.RepeatAST): T;
  public abstract visitSubrange(node: AST.SubrangeAST): T;
  public abstract visitBoolean(node: AST.BooleanAST): T;
  public abstract visitArray(node: AST.ArrayAST): T;
  public abstract visitArrayAccess(node: AST.ArrayAccessAST): T;
  public abstract visitFunctionDeclaration(node: AST.FunctionDeclarationAST): T;
  public abstract visitRead(node: AST.ReadAST): T;
  public abstract visitWrite(node: AST.WriteAST): T;
  public abstract visitExponentiation(node: AST.ExponentiationAST): T;
  public abstract visitConstantDeclaration(node: AST.ConstantDeclarationAST): T;

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

  public visitMultiple(nodes: AST.AST[]): T[] {
    return nodes.map(this.visit.bind(this));
  }
}

export default ASTVisitor;
