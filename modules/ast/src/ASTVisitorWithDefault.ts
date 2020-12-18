import * as AST from './AST';

interface ASTVisitorWithDefault<T = unknown> {
  visitAssignment?(node: AST.AssignmentAST): T;
  visitEmpty?(node: AST.EmptyAST): T;
  visitInteger?(node: AST.IntegerAST): T;
  visitIntegerConstant?(node: AST.IntegerConstantAST): T;
  visitIntegerDivision?(node: AST.IntegerDivisionAST): T;
  visitMinus?(node: AST.MinusAST): T;
  visitMultiplication?(node: AST.MultiplicationAST): T;
  visitPlus?(node: AST.PlusAST): T;
  visitProcedureDeclaration?(node: AST.ProcedureDeclarationAST): T;
  visitProgram?(node: AST.ProgramAST): T;
  visitReal?(node: AST.RealAST): T;
  visitRealConstant?(node: AST.RealConstantAST): T;
  visitRealDivision?(node: AST.RealDivisionAST): T;
  visitUnaryMinus?(node: AST.UnaryMinusAST): T;
  visitUnaryPlus?(node: AST.UnaryPlusAST): T;
  visitVariable?(node: AST.VariableAST): T;
  visitVariableDeclaration?(node: AST.VariableDeclarationAST): T;
  visitMod?(node: AST.ModAST): T;
  visitTrue?(node: AST.TrueConstantAST): T;
  visitFalse?(node: AST.FalseConstantAST): T;
  visitEquals?(node: AST.EqualsAST): T;
  visitNotEquals?(node: AST.NotEqualsAST): T;
  visitGreaterThan?(node: AST.GreaterThanAST): T;
  visitLessThan?(node: AST.LessThanAST): T;
  visitGreaterEquals?(node: AST.GreaterEqualsAST): T;
  visitLessEquals?(node: AST.LessEqualsAST): T;
  visitIf?(node: AST.IfAST): T;
  visitString?(node: AST.StringAST): T;
  visitStringConstant?(node: AST.StringConstantAST): T;
  visitAnd?(node: AST.AndAST): T;
  visitOr?(node: AST.OrAST): T;
  visitNot?(node: AST.NotAST): T;
  visitFunctionCall?(node: AST.FunctionCallAST): T;
  visitProcedureCall?(node: AST.ProcedureCallAST): T;
  visitFor?(node: AST.ForAST): T;
  visitWhile?(node: AST.WhileAST): T;
  visitRepeat?(node: AST.RepeatAST): T;
  visitSubrange?(node: AST.SubrangeAST): T;
  visitBoolean?(node: AST.BooleanAST): T;
  visitArray?(node: AST.ArrayAST): T;
  visitArrayAccess?(node: AST.ArrayAccessAST): T;
  visitFunctionDeclaration?(node: AST.FunctionDeclarationAST): T;
  visitRead?(node: AST.ReadAST): T;
  visitWrite?(node: AST.WriteAST): T;
  visitExponentiation?(node: AST.ExponentiationAST): T;
  visitConstantDeclaration?(node: AST.ConstantDeclarationAST): T;
}

abstract class ASTVisitorWithDefault<T = unknown> {
  public abstract defaultVisit(node: AST.AST): T;

  public visit(node: AST.AST): T {
    if (node instanceof AST.AssignmentAST && this.visitAssignment) {
      return this.visitAssignment(node);
    } else if (node instanceof AST.BooleanAST && this.visitBoolean) {
      return this.visitBoolean(node);
    } else if (node instanceof AST.EmptyAST && this.visitEmpty) {
      return this.visitEmpty(node);
    } else if (node instanceof AST.IntegerAST && this.visitInteger) {
      return this.visitInteger(node);
    } else if (
      node instanceof AST.IntegerConstantAST &&
      this.visitIntegerConstant
    ) {
      return this.visitIntegerConstant(node);
    } else if (
      node instanceof AST.IntegerDivisionAST &&
      this.visitIntegerDivision
    ) {
      return this.visitIntegerDivision(node);
    } else if (node instanceof AST.MinusAST && this.visitMinus) {
      return this.visitMinus(node);
    } else if (
      node instanceof AST.MultiplicationAST &&
      this.visitMultiplication
    ) {
      return this.visitMultiplication(node);
    } else if (node instanceof AST.PlusAST && this.visitPlus) {
      return this.visitPlus(node);
    } else if (
      node instanceof AST.ProcedureDeclarationAST &&
      this.visitProcedureDeclaration
    ) {
      return this.visitProcedureDeclaration(node);
    } else if (node instanceof AST.ProgramAST && this.visitProgram) {
      return this.visitProgram(node);
    } else if (node instanceof AST.RealAST && this.visitReal) {
      return this.visitReal(node);
    } else if (node instanceof AST.RealConstantAST && this.visitRealConstant) {
      return this.visitRealConstant(node);
    } else if (node instanceof AST.RealDivisionAST && this.visitRealDivision) {
      return this.visitRealDivision(node);
    } else if (node instanceof AST.UnaryMinusAST && this.visitUnaryMinus) {
      return this.visitUnaryMinus(node);
    } else if (node instanceof AST.UnaryPlusAST && this.visitUnaryPlus) {
      return this.visitUnaryPlus(node);
    } else if (node instanceof AST.VariableAST && this.visitVariable) {
      return this.visitVariable(node);
    } else if (
      node instanceof AST.VariableDeclarationAST &&
      this.visitVariableDeclaration
    ) {
      return this.visitVariableDeclaration(node);
    } else if (node instanceof AST.ModAST && this.visitMod) {
      return this.visitMod(node);
    } else if (node instanceof AST.TrueConstantAST && this.visitTrue) {
      return this.visitTrue(node);
    } else if (node instanceof AST.FalseConstantAST && this.visitFalse) {
      return this.visitFalse(node);
    } else if (node instanceof AST.EqualsAST && this.visitEquals) {
      return this.visitEquals(node);
    } else if (node instanceof AST.NotEqualsAST && this.visitNotEquals) {
      return this.visitNotEquals(node);
    } else if (node instanceof AST.GreaterThanAST && this.visitGreaterThan) {
      return this.visitGreaterThan(node);
    } else if (node instanceof AST.LessThanAST && this.visitLessThan) {
      return this.visitLessThan(node);
    } else if (
      node instanceof AST.GreaterEqualsAST &&
      this.visitGreaterEquals
    ) {
      return this.visitGreaterEquals(node);
    } else if (node instanceof AST.LessEqualsAST && this.visitLessEquals) {
      return this.visitLessEquals(node);
    } else if (node instanceof AST.IfAST && this.visitIf) {
      return this.visitIf(node);
    } else if (node instanceof AST.StringAST && this.visitString) {
      return this.visitString(node);
    } else if (
      node instanceof AST.StringConstantAST &&
      this.visitStringConstant
    ) {
      return this.visitStringConstant(node);
    } else if (node instanceof AST.AndAST && this.visitAnd) {
      return this.visitAnd(node);
    } else if (node instanceof AST.OrAST && this.visitOr) {
      return this.visitOr(node);
    } else if (node instanceof AST.NotAST && this.visitNot) {
      return this.visitNot(node);
    } else if (node instanceof AST.FunctionCallAST && this.visitFunctionCall) {
      return this.visitFunctionCall(node);
    } else if (
      node instanceof AST.ProcedureCallAST &&
      this.visitProcedureCall
    ) {
      return this.visitProcedureCall(node);
    } else if (node instanceof AST.ForAST && this.visitFor) {
      return this.visitFor(node);
    } else if (node instanceof AST.WhileAST && this.visitWhile) {
      return this.visitWhile(node);
    } else if (node instanceof AST.RepeatAST && this.visitRepeat) {
      return this.visitRepeat(node);
    } else if (node instanceof AST.SubrangeAST && this.visitSubrange) {
      return this.visitSubrange(node);
    } else if (node instanceof AST.ArrayAST && this.visitArray) {
      return this.visitArray(node);
    } else if (node instanceof AST.ArrayAccessAST && this.visitArrayAccess) {
      return this.visitArrayAccess(node);
    } else if (
      node instanceof AST.FunctionDeclarationAST &&
      this.visitFunctionDeclaration
    ) {
      return this.visitFunctionDeclaration(node);
    } else if (node instanceof AST.ReadAST && this.visitRead) {
      return this.visitRead(node);
    } else if (node instanceof AST.WriteAST && this.visitWrite) {
      return this.visitWrite(node);
    } else if (
      node instanceof AST.ExponentiationAST &&
      this.visitExponentiation
    ) {
      return this.visitExponentiation(node);
    } else if (
      node instanceof AST.ConstantDeclarationAST &&
      this.visitConstantDeclaration
    ) {
      return this.visitConstantDeclaration(node);
    } else {
      return this.defaultVisit(node);
    }
  }
}

export default ASTVisitorWithDefault;
