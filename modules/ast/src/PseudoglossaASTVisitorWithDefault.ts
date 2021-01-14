import * as AST from './AST';

interface PseudoglossaASTVisitorWithDefault<T = unknown> {
  visitAssignment?(node: AST.AssignmentAST): T;
  visitEmpty?(node: AST.EmptyAST): T;
  visitIntegerDivision?(node: AST.IntegerDivisionAST): T;
  visitMinus?(node: AST.MinusAST): T;
  visitMultiplication?(node: AST.MultiplicationAST): T;
  visitPlus?(node: AST.PlusAST): T;
  visitRealDivision?(node: AST.RealDivisionAST): T;
  visitUnaryMinus?(node: AST.UnaryMinusAST): T;
  visitUnaryPlus?(node: AST.UnaryPlusAST): T;
  visitVariable?(node: AST.VariableAST): T;
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
  visitStringConstant?(node: AST.StringConstantAST): T;
  visitAnd?(node: AST.AndAST): T;
  visitOr?(node: AST.OrAST): T;
  visitNot?(node: AST.NotAST): T;
  visitFor?(node: AST.ForAST): T;
  visitWhile?(node: AST.WhileAST): T;
  visitRepeat?(node: AST.RepeatAST): T;
  visitSubrange?(node: AST.SubrangeAST): T;
  visitArray?(node: AST.ArrayAST): T;
  visitArrayAccess?(node: AST.ArrayAccessAST): T;
  visitRead?(node: AST.ReadAST): T;
  visitWrite?(node: AST.WriteAST): T;
  visitExponentiation?(node: AST.ExponentiationAST): T;
  visitSwap?(node: AST.SwapAST): T;
  visitAlgorithm?(node: AST.AlgorithmAST): T;
  visitNumberConstant?(node: AST.NumberConstantAST): T;
  visitFunctionCall(node: AST.FunctionCallAST): T;

  visitInteger(node: AST.IntegerAST): never;
  visitProcedureDeclaration(node: AST.ProcedureDeclarationAST): never;
  visitProgram(node: AST.ProgramAST): never;
  visitReal(node: AST.RealAST): never;
  visitVariableDeclaration(node: AST.VariableDeclarationAST): never;
  visitString(node: AST.StringAST): never;
  visitProcedureCall(node: AST.ProcedureCallAST): never;
  visitBoolean(node: AST.BooleanAST): never;
  visitFunctionDeclaration(node: AST.FunctionDeclarationAST): never;
  visitConstantDeclaration(node: AST.ConstantDeclarationAST): never;
  visitIntegerConstant?(node: AST.IntegerConstantAST): never;
  visitRealConstant?(node: AST.RealConstantAST): never;
}

abstract class PseudoglossaASTVisitorWithDefault<T = unknown> {
  public abstract defaultVisit(node: AST.AST): T;

  public visit(node: AST.AST): T {
    if (node instanceof AST.AssignmentAST && this.visitAssignment) {
      return this.visitAssignment(node);
    } else if (node instanceof AST.EmptyAST && this.visitEmpty) {
      return this.visitEmpty(node);
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
    } else if (node instanceof AST.RealDivisionAST && this.visitRealDivision) {
      return this.visitRealDivision(node);
    } else if (node instanceof AST.UnaryMinusAST && this.visitUnaryMinus) {
      return this.visitUnaryMinus(node);
    } else if (node instanceof AST.UnaryPlusAST && this.visitUnaryPlus) {
      return this.visitUnaryPlus(node);
    } else if (node instanceof AST.VariableAST && this.visitVariable) {
      return this.visitVariable(node);
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
    } else if (node instanceof AST.ReadAST && this.visitRead) {
      return this.visitRead(node);
    } else if (node instanceof AST.WriteAST && this.visitWrite) {
      return this.visitWrite(node);
    } else if (
      node instanceof AST.ExponentiationAST &&
      this.visitExponentiation
    ) {
      return this.visitExponentiation(node);
    } else if (node instanceof AST.SwapAST && this.visitSwap) {
      return this.visitSwap(node);
    } else if (node instanceof AST.AlgorithmAST && this.visitAlgorithm) {
      return this.visitAlgorithm(node);
    } else if (
      node instanceof AST.NumberConstantAST &&
      this.visitNumberConstant
    ) {
      return this.visitNumberConstant(node);
    } else if (node instanceof AST.FunctionCallAST && this.visitFunctionCall) {
      return this.visitFunctionCall(node);
    } else {
      return this.defaultVisit(node);
    }
  }

  public visitMultiple(nodes: AST.AST[]) {
    return nodes.map(this.visit.bind(this));
  }
}

export default PseudoglossaASTVisitorWithDefault;
