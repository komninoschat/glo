import * as Lexer from '@glossa-glo/lexer';
import * as AST from '@glossa-glo/ast';
import * as Types from '@glossa-glo/data-types';
import GLOError, { DebugInfoProvider } from '@glossa-glo/error';

export class Parser {
  private currentToken: Lexer.Token; // Only change through this.eat
  private previousToken: Lexer.Token | null = null; // Needed for better errors. Skips Lexer.NewLineToken
  private lexer: Lexer.Lexer;

  constructor(lexer: Lexer.Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  get previousTokenEndLocationProvider() {
    return new DebugInfoProvider([
      [
        this.previousToken!.end.linePosition,
        this.previousToken!.end.characterPosition - 1,
      ],
      [
        this.previousToken!.end.linePosition,
        this.previousToken!.end.characterPosition,
      ],
    ]);
  }

  private eat(
    type: any,
    message?: string,
    previousTokenThrow = false,
    throwEntirePreviousToken = false,
  ) {
    if (this.currentToken instanceof type) {
      if (!(this.currentToken instanceof Lexer.NewLineToken)) {
        this.previousToken = this.currentToken;
      }
      return this.lexer.getNextToken();
    } else {
      throw new GLOError(
        previousTokenThrow
          ? throwEntirePreviousToken
            ? this.previousToken!
            : this.previousTokenEndLocationProvider
          : this.currentToken instanceof Lexer.NewLineToken
          ? this.peek()
          : this.currentToken,
        message ||
          `Expected ${this.currentToken.constructor.name} to be ${type.name}`,
      );
    }
  }

  private peek() {
    return this.lexer.peekNextToken();
  }

  private nl(errorMessage: string) {
    this.currentToken = this.eat(Lexer.NewLineToken, errorMessage, true);

    while (this.currentToken instanceof Lexer.NewLineToken) {
      this.currentToken = this.eat(Lexer.NewLineToken);
    }

    return new AST.EmptyAST();
  }

  private repeatLoop() {
    const repeatToken = Object.assign({}, this.currentToken);
    this.currentToken = this.eat(Lexer.RepeatToken);

    this.nl('Περίμενα νέα γραμμή μετά από ΑΡΧΗ_ΕΠΑΝΑΛΗΨΗΣ');

    const statementList = this.statementList();

    this.currentToken = this.eat(
      Lexer.UntilToken,
      'Περίμενα ΜΕΧΡΙΣ_ΟΤΟΥ μετά τη λήξη της επανάληψης',
      true,
    );

    const condition = this.expression();

    return new AST.RepeatAST(condition, statementList).inheritPositionFrom(
      repeatToken,
    );
  }

  private whileLoop() {
    const whileToken = Object.assign({}, this.currentToken);
    this.currentToken = this.eat(Lexer.WhileToken);

    const condition = this.expression();

    this.currentToken = this.eat(
      Lexer.DoToken,
      'Περίμενα ΕΠΑΝΑΛΑΒΕ μετά από συνθήκη',
      true,
    );

    this.nl('Περίμενα νέα γραμμή μετά από ΕΠΑΝΑΛΑΒΕ');

    const statementList = this.statementList();

    this.currentToken = this.eat(
      Lexer.LoopEndToken,
      'Περίμενα ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ στο τέλος δομής επανάληψης',
    );

    return new AST.WhileAST(condition, statementList).inheritPositionFrom(
      whileToken,
    );
  }

  private forLoop() {
    const forToken = Object.assign({}, this.currentToken);
    this.currentToken = this.eat(Lexer.ForToken);

    let counter: AST.VariableAST | AST.ArrayAccessAST;

    if (this.peek() instanceof Lexer.OpeningBracketToken) {
      counter = this.arrayAccess();
    } else {
      counter = this.variable();
    }

    this.currentToken = this.eat(
      Lexer.FromToken,
      'Περίμενα ΑΠΟ μετά τη μεταβλητή επανάληψης',
    );

    const startValue = this.expression();

    this.currentToken = this.eat(
      Lexer.ToToken,
      'Περίμενα ΜΕΧΡΙ μετά την αρχική τιμή της μεταβλητής της επανάληψης',
      true,
    );

    const endValue = this.expression();

    let step: AST.AST = new AST.IntegerConstantAST(new Types.GLOInteger(1));

    if (this.currentToken instanceof Lexer.WithStepToken) {
      this.currentToken = this.eat(Lexer.WithStepToken);

      step = this.expression();
    }

    this.nl('Περίμενα νέα γραμμή μετά από κεφάλι επανάληψης');

    const statementList = this.statementList();

    this.currentToken = this.eat(
      Lexer.LoopEndToken,
      'Περίμενα ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ στο τέλος δομής επανάληψης',
    );

    return new AST.ForAST(
      counter,
      startValue,
      endValue,
      step,
      statementList,
    ).inheritPositionFrom(forToken);
  }

  private if() {
    const ifToken = Object.assign({}, this.currentToken);
    this.currentToken = this.eat(Lexer.IfToken);

    const condition = this.expression();

    this.currentToken = this.eat(
      Lexer.ThenToken,
      'Περίμενα ΤΟΤΕ μετά από συνθήκη επιλογής',
      true,
    );

    this.nl('Περίμενα νέα γραμμή μετά από ΤΟΤΕ');

    const statementList = this.statementList();

    return new AST.IfAST(condition, statementList).inheritPositionFrom(ifToken);
  }

  private ifStatement() {
    const firstIf = this.if();
    let currentIf = firstIf;

    while (this.currentToken instanceof Lexer.ElseIfToken) {
      const elseIfToken = Object.assign({}, this.currentToken);
      this.currentToken = this.eat(Lexer.ElseIfToken);

      const condition = this.expression();

      this.currentToken = this.eat(
        Lexer.ThenToken,
        'Περίμενα ΤΟΤΕ μετά από συνθήκη επιλογής',
        true,
      );

      this.nl('Περίμενα νέα γραμμή μετά από ΤΟΤΕ');

      const statementList = this.statementList();

      const newIf = new AST.IfAST(condition, statementList).inheritPositionFrom(
        elseIfToken,
      );

      currentIf.addNext(newIf);
      currentIf = newIf;
    }

    if (this.currentToken instanceof Lexer.ElseToken) {
      this.currentToken = this.eat(Lexer.ElseToken);

      this.nl('Περίμενα νέα γραμμή μετά από ΑΛΛΙΩΣ');

      currentIf.addNext(this.statementList());
    }

    this.currentToken = this.eat(
      Lexer.EndIfToken,
      `Περίμενα ΤΕΛΟΣ_ΑΝ στο τέλος επιλογής`,
    );

    return firstIf;
  }

  private selectCase(selectValue: AST.AST): AST.AST | [AST.AST, AST.AST] {
    const savedToken = Object.assign({}, this.currentToken);

    if (this.currentToken instanceof Lexer.EqualsToken) {
      this.currentToken = this.eat(Lexer.EqualsToken);
      return new AST.EqualsAST(
        selectValue,
        this.expression(),
      ).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.NotEqualsToken) {
      this.currentToken = this.eat(Lexer.NotEqualsToken);
      return new AST.NotEqualsAST(
        selectValue,
        this.expression(),
      ).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.GreaterThanToken) {
      this.currentToken = this.eat(Lexer.GreaterThanToken);
      return new AST.GreaterThanAST(
        selectValue,
        this.expression(),
      ).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.LessThanToken) {
      this.currentToken = this.eat(Lexer.LessThanToken);
      return new AST.LessThanAST(
        selectValue,
        this.expression(),
      ).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.GreaterEqualsToken) {
      this.currentToken = this.eat(Lexer.GreaterEqualsToken);
      return new AST.GreaterEqualsAST(
        selectValue,
        this.expression(),
      ).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.LessEqualsToken) {
      this.currentToken = this.eat(Lexer.LessEqualsToken);
      return new AST.LessEqualsAST(
        selectValue,
        this.expression(),
      ).inheritPositionFrom(savedToken);
    } else if (
      this.currentToken instanceof Lexer.IntegerConstToken &&
      this.peek() instanceof Lexer.DoubleDotToken
    ) {
      const left = this.atom() as AST.IntegerConstantAST;

      const doubleDotToken = Object.assign({}, this.currentToken);
      this.currentToken = this.eat(Lexer.DoubleDotToken);

      if (!(this.currentToken instanceof Lexer.IntegerConstToken)) {
        throw new GLOError(
          this.currentToken instanceof Lexer.NewLineToken
            ? this.previousToken!
            : this.currentToken,
          this.currentToken instanceof Lexer.NewLineToken
            ? 'Περίμενα δεξιά ακέραια τιμή για το εύρος'
            : 'Περίμενα να δώ ακέραια τιμή για το εύρος',
        );
      }

      const right = this.atom() as AST.IntegerConstantAST;

      return [
        new AST.GreaterEqualsAST(selectValue, left).inheritPositionFrom(
          doubleDotToken,
        ),
        new AST.LessEqualsAST(selectValue, right).inheritPositionFrom(
          doubleDotToken,
        ),
      ];
    } else {
      const expr = this.expression();

      return new AST.EqualsAST(selectValue, expr).inheritPositionFrom(expr);
    }
  }

  private selectStatement() {
    this.currentToken = this.eat(Lexer.SelectToken);
    const selectValue = this.expression();

    this.nl('Περίμενα νέα γραμμή μετά από την έκφραση δομής επιλογής');

    const ifStatements: AST.IfAST[] = [];

    do {
      const caseToken = Object.assign({}, this.currentToken);
      this.currentToken = this.eat(
        Lexer.CaseToken,
        'Περίμενα ΠΕΡΙΠΤΩΣΗ μέσα στη δομή επιλογής',
      );

      const conditions = [];

      const res = this.selectCase(selectValue);

      if (Array.isArray(res)) {
        conditions.push(new AST.AndAST(res[0], res[1]));
      } else {
        conditions.push(res);
      }

      while (this.currentToken instanceof Lexer.CommaToken) {
        this.currentToken = this.eat(Lexer.CommaToken);

        if (this.currentToken instanceof Lexer.NewLineToken) {
          throw new GLOError(
            this.previousToken!,
            'Περίμενα συνθήκη μετά το κόμμα στην εντολή ΕΠΙΛΕΞΕ',
          );
        }

        const res = this.selectCase(selectValue);

        if (Array.isArray(res)) {
          conditions.push(new AST.AndAST(res[0], res[1]));
        } else {
          conditions.push(res);
        }
      }

      this.nl(
        `Περίμενα νέα γραμμή μετά από ${
          conditions.length === 1 ? 'την περίπτωση' : 'τις περιπτώσεις'
        } δομής επιλογής`,
      );

      const statementList = this.statementList();

      function orify(conditions: AST.AST[]): AST.AST {
        if (conditions.length === 1) return conditions[0];
        else return new AST.OrAST(conditions[0], orify(conditions.slice(1)));
      }

      ifStatements.push(
        new AST.IfAST(orify(conditions), statementList).inheritPositionFrom(
          caseToken,
        ),
      );
    } while (
      this.currentToken instanceof Lexer.CaseToken &&
      !(this.peek() instanceof Lexer.ElseToken)
    );

    const firstIf = ifStatements[0];
    let currentIf = firstIf;

    for (const ifStatement of ifStatements.slice(1)) {
      currentIf.next = ifStatement;
      currentIf = ifStatement;
    }

    if (
      this.currentToken instanceof Lexer.CaseToken &&
      this.peek() instanceof Lexer.ElseToken
    ) {
      this.currentToken = this.eat(Lexer.CaseToken);
      this.currentToken = this.eat(Lexer.ElseToken);

      currentIf.next = this.statementList();
    }

    this.currentToken = this.eat(
      Lexer.SelectEndToken,
      'Περίμενα ΤΕΛΟΣ_ΕΠΙΛΟΓΩΝ στο τέλος δομής επιλογής',
    );

    return firstIf;
  }

  private constantDeclaration() {
    this.currentToken = this.eat(Lexer.ConstantToken);

    this.nl('Περίμενα νέα γραμμή μετά από ΣΤΑΘΕΡΕΣ');

    const declarations: AST.ConstantDeclarationAST[] = [];

    do {
      const variableToken = Object.assign({}, this.currentToken);
      const variable = this.variable();

      this.currentToken = this.eat(
        Lexer.EqualsToken,
        "Περίμενα '=' μετά από όνομα σταθεράς",
      );

      if (this.currentToken instanceof Lexer.NewLineToken) {
        throw new GLOError(
          this.previousToken!,
          "Περίμενα έκφραση μετά από το '=' στη δήλωση σταθεράς",
        );
      }

      const expression = this.expression();

      declarations.push(
        new AST.ConstantDeclarationAST(
          variable,
          expression,
        ).inheritPositionFrom(variableToken),
      );

      this.nl('Περίμενα νέα γραμμή μετά τη δήλωση σταθεράς');
    } while (this.currentToken instanceof Lexer.IdToken);

    return declarations;
  }

  private variableDeclaration() {
    const variableOrArrayDeclaration = (type: AST.TypeAST) => {
      const variableToken = Object.assign({}, this.currentToken);
      const variable = this.variable();
      const dimensionLength = [];

      if (this.currentToken instanceof Lexer.OpeningBracketToken) {
        this.currentToken = this.eat(Lexer.OpeningBracketToken);

        dimensionLength.push(this.expression());

        while (this.currentToken instanceof Lexer.CommaToken) {
          this.currentToken = this.eat(Lexer.CommaToken);

          if (this.currentToken instanceof Lexer.ClosingBracketToken) {
            throw new GLOError(
              this.previousToken!,
              'Περίμενα έκφραση μετά το κόμμα στην δήλωση διαστάσεων πίνακα',
            );
          }

          dimensionLength.push(this.expression());
        }

        this.currentToken = this.eat(
          Lexer.ClosingBracketToken,
          'Περίμενα κλείσιμο αγκύλης μετά τον ορισμό πίνακα',
          true,
        );
      }

      if (dimensionLength.length) {
        return new AST.VariableDeclarationAST(
          variable,
          new AST.ArrayAST(dimensionLength, type),
        ).inheritPositionFrom(variableToken);
      } else {
        return new AST.VariableDeclarationAST(
          variable,
          type,
        ).inheritPositionFrom(variableToken);
      }
    };

    this.currentToken = this.eat(Lexer.VariableToken);

    this.nl('Περίμενα νέα γραμμή μετά από ΜΕΤΑΒΛΗΤΕΣ');

    if (this.currentToken instanceof Lexer.BeginToken) {
      throw new GLOError(
        this.previousToken!,
        'Περίμενα δήλωση μεταβλητών μετά από ΜΕΤΑΒΛΗΤΕΣ',
      );
    }

    const declarations: AST.VariableDeclarationAST[] = [];

    do {
      const type = this.type();

      this.currentToken = this.eat(
        Lexer.ColonToken,
        'Περίμενα άνω-κάτω τελεία μετά τον τύπο μεταβλητής',
        true,
      );

      if (!(this.currentToken instanceof Lexer.IdToken)) {
        throw new GLOError(
          !(this.currentToken instanceof Lexer.NewLineToken)
            ? this.currentToken
            : this.previousToken!,
          'Περίμενα όνομα μεταβλητής μετά από άνω-κάτω τελεία',
        );
      }

      const ids = [variableOrArrayDeclaration(type)];

      while (this.currentToken instanceof Lexer.CommaToken) {
        this.currentToken = this.eat(Lexer.CommaToken);

        if (this.currentToken instanceof Lexer.NewLineToken) {
          throw new GLOError(
            this.previousToken!,
            'Περίμενα μεταβλητή ή πίνακα μετά το κόμμα στην δήλωση μεταβλητών',
          );
        }

        ids.push(variableOrArrayDeclaration(type));
      }

      ids.forEach(d => declarations.push(d));

      if (this.currentToken instanceof Lexer.IdToken) {
        throw new GLOError(
          this.previousToken!,
          'Περίμενα κόμμα ανάμεσα από τις δηλώσεις δύο μεταβλητών',
        );
      }

      this.nl('Περίμενα νέα γραμμή μετά τη δήλωση μεταβλητών ενός τύπου');
    } while (
      this.currentToken instanceof Lexer.IntegerToken ||
      this.currentToken instanceof Lexer.RealToken ||
      this.currentToken instanceof Lexer.StringToken ||
      this.currentToken instanceof Lexer.BooleanToken
    );

    return declarations;
  }

  private constantOrVariableDeclaration() {
    let constantDeclarations: AST.ConstantDeclarationAST[] = [];
    let variableDeclarations: AST.VariableDeclarationAST[] = [];

    if (this.currentToken instanceof Lexer.ConstantToken) {
      constantDeclarations = this.constantDeclaration();
    }

    if (this.currentToken instanceof Lexer.VariableToken) {
      variableDeclarations = this.variableDeclaration();
    }

    if (
      this.currentToken instanceof Lexer.ConstantToken &&
      !constantDeclarations.length
    ) {
      throw new GLOError(
        this.currentToken,
        'Οι σταθερές πρέπει να δηλώνονται πρίν από τις μεταβλητές',
      );
    }

    return {
      constantDeclarations,
      variableDeclarations,
    };
  }

  private subprogramDeclarations() {
    const declarations: (
      | AST.ProcedureDeclarationAST
      | AST.FunctionDeclarationAST
    )[] = [];
    while (
      this.currentToken instanceof Lexer.ProcedureToken ||
      this.currentToken instanceof Lexer.FunctionToken
    ) {
      if (this.currentToken instanceof Lexer.ProcedureToken) {
        declarations.push(this.procedureDeclaration());
      } else if (this.currentToken instanceof Lexer.FunctionToken) {
        declarations.push(this.functionDeclaration());
      }
    }

    return declarations;
  }

  private procedureOrFunctionParameterList(type: 'procedure' | 'function') {
    const params: AST.VariableAST[] = [];

    if (this.currentToken instanceof Lexer.IdToken) {
      params.push(this.variable());
      while (this.currentToken instanceof Lexer.CommaToken) {
        this.currentToken = this.eat(Lexer.CommaToken);

        if (this.currentToken instanceof Lexer.ClosingParenthesisToken) {
          throw new GLOError(
            this.previousToken!,
            `Περίμενα όνομα μεταβλητής μετά το κόμμα στην δήλωση παραμέτρων ${
              type === 'procedure' ? 'διαδικασίας' : 'συνάρτησης'
            }`,
          );
        }

        params.push(this.variable());
      }

      if (this.currentToken instanceof Lexer.IdToken) {
        throw new GLOError(
          this.previousToken!,
          `Περίμενα κόμμα ανάμεσα στις δηλώσεις δύο παραμέτρων ${
            type === 'procedure' ? 'διαδικασίας' : 'συνάρτησης'
          }`,
        );
      }
    }

    return params;
  }

  private procedureDeclaration() {
    const procedureToken = Object.assign({}, this.currentToken);

    this.currentToken = this.eat(Lexer.ProcedureToken);

    const name = this.variable();

    let args: AST.VariableAST[] = [];
    if (this.currentToken instanceof Lexer.OpeningParenthesisToken) {
      this.currentToken = this.eat(Lexer.OpeningParenthesisToken);
      args = this.procedureOrFunctionParameterList('procedure');
      this.currentToken = this.eat(
        Lexer.ClosingParenthesisToken,
        'Περίμενα κλείσιμο παρένθεσης μετά από παραμέτρους διαδικασίας',
        true,
      );
    }

    this.nl('Περίμενα νέα γραμμή μετά από ορισμό κεφαλιού διαδικασίας');

    const declarations: AST.VariableDeclarationAST[] = [];

    const {
      constantDeclarations,
      variableDeclarations,
    } = this.constantOrVariableDeclaration();

    this.currentToken = this.eat(
      Lexer.BeginToken,
      'Περίμενα ΑΡΧΗ στην αρχή μιας διαδικασίας',
    );

    const statementList = this.statementList();

    this.currentToken = this.eat(
      Lexer.ProcedureEndToken,
      'Περίμενα ΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ στο τέλος μιας διαδικασίας',
    );

    this.nl('Περίμενα νέα γραμμή μετά από ΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ');

    return new AST.ProcedureDeclarationAST(
      name,
      args,
      constantDeclarations,
      variableDeclarations,
      statementList,
    ).inheritPositionFrom(procedureToken);
  }

  private functionDeclaration() {
    const functionToken = Object.assign({}, this.currentToken);

    this.currentToken = this.eat(Lexer.FunctionToken);

    const name = this.variable();

    let args: AST.VariableAST[] = [];
    if (this.currentToken instanceof Lexer.OpeningParenthesisToken) {
      this.currentToken = this.eat(Lexer.OpeningParenthesisToken);
      args = this.procedureOrFunctionParameterList('function');
      this.currentToken = this.eat(
        Lexer.ClosingParenthesisToken,
        'Περίμενα κλείσιμο παρένθεσης μετά από παραμέτρους συνάρτησης',
        true,
      );
    }

    this.currentToken = this.eat(
      Lexer.ColonToken,
      `Περίμενα άνω-κάτω τελεία μετά το κλείσιμο παρένθεσης στη δήλωση συνάρτησης`,
      true,
    );

    const returnType = this.functionReturnType();

    this.nl('Περίμενα νέα γραμμή μετά άπο ορισμό κεφαλιού συνάρτησης');

    const {
      constantDeclarations,
      variableDeclarations,
    } = this.constantOrVariableDeclaration();

    this.currentToken = this.eat(
      Lexer.BeginToken,
      'Περίμενα ΑΡΧΗ στην αρχή μιας συνάρτησης',
    );

    const statementList = this.statementList();

    this.currentToken = this.eat(
      Lexer.FunctionEndToken,
      'Περίμενα ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ στο τέλος μιας συνάρτησης',
    );

    this.nl('Περίμενα νέα γραμμή μετά από ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ');

    return new AST.FunctionDeclarationAST(
      name,
      args,
      returnType,
      constantDeclarations,
      variableDeclarations,
      statementList,
    ).inheritPositionFrom(functionToken);
  }

  private subrange() {
    if (!(this.currentToken instanceof Lexer.IntegerConstToken)) {
      throw new GLOError(
        this.currentToken,
        'Περίμενα ακέραια αρχική τιμή εύρους',
      );
    }
    const start = this.currentToken;
    this.currentToken = this.eat(Lexer.IntegerConstToken);

    this.currentToken = this.eat(Lexer.DoubleDotToken);

    if (!(this.currentToken instanceof Lexer.IntegerConstToken)) {
      throw new GLOError(
        this.currentToken,
        'Περίμενα ακέραια τελική τιμή εύρους',
      );
    }
    const end = this.currentToken;
    this.currentToken = this.eat(Lexer.IntegerConstToken);

    return new AST.SubrangeAST(start.value, end.value)
      .inheritStartPositionFrom(start.start)
      .inheritEndPositionFrom(end.end);
  }

  private type() {
    const savedToken = Object.assign({}, this.currentToken);

    if (this.currentToken instanceof Lexer.IntegerToken) {
      this.currentToken = this.eat(Lexer.IntegerToken);
      return new AST.IntegerAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.RealToken) {
      this.currentToken = this.eat(Lexer.RealToken);
      return new AST.RealAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.BooleanToken) {
      this.currentToken = this.eat(Lexer.BooleanToken);
      return new AST.BooleanAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.StringToken) {
      this.currentToken = this.eat(Lexer.StringToken);
      return new AST.StringAST().inheritPositionFrom(savedToken);
    } else {
      throw new GLOError(this.currentToken, 'Μη έγκυρος τύπος μεταβλητής');
    }
  }

  private program() {
    const programToken = Object.assign({}, this.currentToken);

    while (this.currentToken instanceof Lexer.NewLineToken) {
      this.currentToken = this.eat(Lexer.NewLineToken);
    }

    this.currentToken = this.eat(
      Lexer.ProgramToken,
      'Περίμενα το πρόγραμμα να αρχίζει με εντολή ΠΡΟΓΡΑΜΜΑ',
    );

    const programName = this.variable().name;

    this.nl('Περίμενα νέα γραμμή μετά από το όνομα προγράμματος');

    const {
      constantDeclarations,
      variableDeclarations,
    } = this.constantOrVariableDeclaration();

    this.currentToken = this.eat(
      Lexer.BeginToken,
      'Περίμενα ΑΡΧΗ μετά το τμήμα δηλώσεων προγράμματος',
    );

    this.nl('Περίμενα νέα γραμμή μετά από ΑΡΧΗ');

    const statementList = this.statementList();

    this.currentToken = this.eat(
      Lexer.ProgramEndToken,
      'Περίμενα ΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ στο τέλος του προγράμματος',
    );

    this.nl('Περίμενα νέα γραμμή μετά από ΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ');

    const subprogramDeclarations = this.subprogramDeclarations();

    if (!(this.currentToken instanceof Lexer.EofToken)) {
      throw new GLOError(
        this.currentToken,
        'Περίμενα ΔΙΑΔΙΚΑΣΙΑ ή ΣΥΝΑΡΤΗΣΗ μετά από ΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ',
      );
    }

    return new AST.ProgramAST(
      programName,
      [
        ...constantDeclarations,
        ...variableDeclarations,
        ...subprogramDeclarations,
      ],
      statementList,
    ).inheritPositionFrom(programToken);
  }

  private statementList() {
    const statements = [this.statement()];

    while (this.currentToken instanceof Lexer.NewLineToken) {
      this.currentToken = this.eat(Lexer.NewLineToken);
      statements.push(this.statement());
    }

    return statements;
  }

  private readStatement() {
    const variableOrArrayAccess = () => {
      const variable = this.variable();
      const dimensionLength = [];

      let closingBracketToken: Lexer.ClosingBracketToken | null = null;

      if (this.currentToken instanceof Lexer.OpeningBracketToken) {
        this.currentToken = this.eat(Lexer.OpeningBracketToken);

        dimensionLength.push(this.expression());

        while (this.currentToken instanceof Lexer.CommaToken) {
          this.currentToken = this.eat(Lexer.CommaToken);

          if (this.currentToken instanceof Lexer.ClosingBracketToken) {
            throw new GLOError(
              this.previousToken!,
              'Περίμενα έκφραση μετά το κόμμα στην πρόσβαση πίνακα',
            );
          }

          dimensionLength.push(this.expression());
        }

        closingBracketToken = Object.assign({}, this.currentToken);

        this.currentToken = this.eat(
          Lexer.ClosingBracketToken,
          'Περίμενα κλείσιμο αγκύλης μετά τον ορισμό πίνακα',
          true,
        );
      }

      if (dimensionLength.length) {
        return new AST.ArrayAccessAST(variable, dimensionLength)
          .inheritStartPositionFrom(variable.start)
          .inheritEndPositionFrom(closingBracketToken!.end);
      } else {
        return variable;
      }
    };

    const readToken = Object.assign({}, this.currentToken);
    this.currentToken = this.eat(Lexer.ReadToken);

    if (this.currentToken instanceof Lexer.NewLineToken) {
      throw new GLOError(
        this.previousToken!,
        'Περίμενα παραμέτρους για την εντολή ΔΙΑΒΑΣΕ',
      );
    }

    const args = [variableOrArrayAccess()];

    while (this.currentToken instanceof Lexer.CommaToken) {
      this.currentToken = this.eat(Lexer.CommaToken);

      if (this.currentToken instanceof Lexer.NewLineToken) {
        throw new GLOError(
          this.previousToken!,
          'Περίμενα μεταβλητή ή στοιχείο πίνακα μετά το κόμμα στην εντολή ΔΙΑΒΑΣΕ',
        );
      }

      args.push(variableOrArrayAccess());
    }

    return new AST.ReadAST(args).inheritPositionFrom(readToken);
  }

  private writeStatement() {
    const writeToken = Object.assign({}, this.currentToken);
    this.currentToken = this.eat(Lexer.WriteToken);

    if (this.currentToken instanceof Lexer.NewLineToken) {
      throw new GLOError(
        this.previousToken!,
        'Περίμενα παραμέτρους για την εντολή ΓΡΑΨΕ',
      );
    }

    const args = [this.expression()];

    while (this.currentToken instanceof Lexer.CommaToken) {
      this.currentToken = this.eat(Lexer.CommaToken);

      if (this.currentToken instanceof Lexer.NewLineToken) {
        throw new GLOError(
          this.previousToken!,
          'Περίμενα έκφραση μετά το κόμμα στην εντολή ΓΡΑΨΕ',
        );
      }

      args.push(this.expression());
    }

    return new AST.WriteAST(args).inheritPositionFrom(writeToken);
  }

  private statement(): AST.AST {
    if (this.currentToken instanceof Lexer.CallToken) {
      return this.callProcedure();
    } else if (this.currentToken instanceof Lexer.IdToken) {
      return this.assignmentExpression();
    } else if (this.currentToken instanceof Lexer.IfToken) {
      return this.ifStatement();
    } else if (this.currentToken instanceof Lexer.SelectToken) {
      return this.selectStatement();
    } else if (this.currentToken instanceof Lexer.ForToken) {
      return this.forLoop();
    } else if (this.currentToken instanceof Lexer.WhileToken) {
      return this.whileLoop();
    } else if (this.currentToken instanceof Lexer.RepeatToken) {
      return this.repeatLoop();
    } else if (this.currentToken instanceof Lexer.ReadToken) {
      return this.readStatement();
    } else if (this.currentToken instanceof Lexer.WriteToken) {
      return this.writeStatement();
    } else {
      return this.empty();
    }
  }

  private functionReturnType() {
    const savedToken = Object.assign({}, this.currentToken);

    if (this.currentToken instanceof Lexer.IntegerSingularToken) {
      this.currentToken = this.eat(Lexer.IntegerSingularToken);
      return new AST.IntegerAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.RealSingularToken) {
      this.currentToken = this.eat(Lexer.RealSingularToken);
      return new AST.RealAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.StringSingularToken) {
      this.currentToken = this.eat(Lexer.StringSingularToken);
      return new AST.StringAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.BooleanSingularToken) {
      this.currentToken = this.eat(Lexer.BooleanSingularToken);
      return new AST.BooleanAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.IdToken) {
      throw new GLOError(
        this.currentToken,
        'Μη έγκυρος τύπος συνάρτησης. Περίμενα ΠΡΑΓΜΑΤΙΚΗ ή ΑΚΕΡΑΙΑ ή ΧΑΡΑΚΤΗΡΑΣ ή ΛΟΓΙΚΗ',
      );
    } else {
      throw new GLOError(
        this.previousToken!,
        'Περίμενα τύπο συνάρτησης μετά από την άνω-κάτω τελεία',
      );
    }
  }

  private assignmentExpression() {
    let left: AST.VariableAST | AST.ArrayAccessAST;
    if (this.peek() instanceof Lexer.OpeningBracketToken) {
      left = this.arrayAccess();
    } else {
      left = this.variable();
    }

    const assignmentToken = Object.assign({}, this.currentToken);
    this.currentToken = this.eat(
      Lexer.AssignToken,
      'Μη έγκυρη εντολή',
      true,
      true,
    ); // Not enough information to determine whether user actually wanted an assignment statement
    return new AST.AssignmentAST(left, this.expression()).inheritPositionFrom(
      assignmentToken,
    );
  }

  private variable() {
    if (!(this.currentToken instanceof Lexer.IdToken)) {
      throw new GLOError(this.currentToken, 'Περίμενα όνομα μεταβλητής');
    }

    const node = new AST.VariableAST(
      this.currentToken.value,
    ).inheritPositionFrom(this.currentToken);
    this.currentToken = this.eat(Lexer.IdToken);

    return node;
  }

  private arrayAccess() {
    const array = this.variable();

    this.currentToken = this.eat(Lexer.OpeningBracketToken);

    const accessors = [this.expression()];

    while (this.currentToken instanceof Lexer.CommaToken) {
      this.currentToken = this.eat(Lexer.CommaToken);

      if (this.currentToken instanceof Lexer.ClosingBracketToken) {
        throw new GLOError(
          this.previousToken!,
          'Περίμενα έκφραση μετά το κόμμα στην πρόσβαση πίνακα',
        );
      }

      accessors.push(this.expression());
    }

    this.currentToken = this.eat(
      Lexer.ClosingBracketToken,
      'Περίμενα κλείσιμο αγκύλης μετά τους δείκτες πίνακα',
      true,
    );

    return new AST.ArrayAccessAST(array, accessors)
      .inheritStartPositionFrom(array.start)
      .inheritEndPositionFrom(accessors[accessors.length - 1].end);
  }

  private empty() {
    return new AST.EmptyAST();
  }

  private expression(): AST.AST {
    let current = this.and();

    while (this.currentToken instanceof Lexer.OrToken) {
      const orToken = Object.assign({}, this.currentToken);

      this.currentToken = this.eat(Lexer.OrToken);

      current = new AST.OrAST(current, this.and()).inheritPositionFrom(orToken);
    }

    return current;
  }

  private and(): AST.AST {
    let current = this.comparison();

    while (this.currentToken instanceof Lexer.AndToken) {
      const andToken = Object.assign({}, this.currentToken);

      this.currentToken = this.eat(Lexer.AndToken);

      current = new AST.AndAST(current, this.comparison()).inheritPositionFrom(
        andToken,
      );
    }

    return current;
  }

  private comparison() {
    let current = this.term();
    const savedToken = Object.assign({}, this.currentToken);

    while (
      this.currentToken instanceof Lexer.EqualsToken ||
      this.currentToken instanceof Lexer.NotEqualsToken ||
      this.currentToken instanceof Lexer.GreaterThanToken ||
      this.currentToken instanceof Lexer.LessThanToken ||
      this.currentToken instanceof Lexer.GreaterEqualsToken ||
      this.currentToken instanceof Lexer.LessEqualsToken
    ) {
      if (this.currentToken instanceof Lexer.EqualsToken) {
        this.currentToken = this.eat(Lexer.EqualsToken);
        current = new AST.EqualsAST(current, this.term()).inheritPositionFrom(
          savedToken,
        );
      } else if (this.currentToken instanceof Lexer.NotEqualsToken) {
        this.currentToken = this.eat(Lexer.NotEqualsToken);
        current = new AST.NotEqualsAST(
          current,
          this.term(),
        ).inheritPositionFrom(savedToken);
      } else if (this.currentToken instanceof Lexer.GreaterThanToken) {
        this.currentToken = this.eat(Lexer.GreaterThanToken);
        current = new AST.GreaterThanAST(
          current,
          this.term(),
        ).inheritPositionFrom(savedToken);
      } else if (this.currentToken instanceof Lexer.LessThanToken) {
        this.currentToken = this.eat(Lexer.LessThanToken);
        current = new AST.LessThanAST(current, this.term()).inheritPositionFrom(
          savedToken,
        );
      } else if (this.currentToken instanceof Lexer.GreaterEqualsToken) {
        this.currentToken = this.eat(Lexer.GreaterEqualsToken);
        current = new AST.GreaterEqualsAST(
          current,
          this.term(),
        ).inheritPositionFrom(savedToken);
      } else if (this.currentToken instanceof Lexer.LessEqualsToken) {
        this.currentToken = this.eat(Lexer.LessEqualsToken);
        current = new AST.LessEqualsAST(
          current,
          this.term(),
        ).inheritPositionFrom(savedToken);
      }
    }
    return current;
  }

  private term() {
    let current = this.factor();
    const savedToken = Object.assign({}, this.currentToken);

    while (
      this.currentToken instanceof Lexer.PlusToken ||
      this.currentToken instanceof Lexer.MinusToken
    ) {
      if (this.currentToken instanceof Lexer.PlusToken) {
        this.currentToken = this.eat(Lexer.PlusToken);
        current = new AST.PlusAST(current, this.factor()).inheritPositionFrom(
          savedToken,
        );
      } else if (this.currentToken instanceof Lexer.MinusToken) {
        this.currentToken = this.eat(Lexer.MinusToken);
        current = new AST.MinusAST(current, this.factor()).inheritPositionFrom(
          savedToken,
        );
      }
    }

    return current;
  }

  private factor() {
    let current = this.power();
    const savedToken = Object.assign({}, this.currentToken);

    while (
      this.currentToken instanceof Lexer.MultiplicationToken ||
      this.currentToken instanceof Lexer.IntegerDivisionToken ||
      this.currentToken instanceof Lexer.RealDivisionToken ||
      this.currentToken instanceof Lexer.ModToken
    ) {
      if (this.currentToken instanceof Lexer.MultiplicationToken) {
        this.currentToken = this.eat(Lexer.MultiplicationToken);
        current = new AST.MultiplicationAST(
          current,
          this.power(),
        ).inheritPositionFrom(savedToken);
      } else if (this.currentToken instanceof Lexer.IntegerDivisionToken) {
        this.currentToken = this.eat(Lexer.IntegerDivisionToken);
        current = new AST.IntegerDivisionAST(
          current,
          this.power(),
        ).inheritPositionFrom(savedToken);
      } else if (this.currentToken instanceof Lexer.RealDivisionToken) {
        this.currentToken = this.eat(Lexer.RealDivisionToken);
        current = new AST.RealDivisionAST(
          current,
          this.power(),
        ).inheritPositionFrom(savedToken);
      } else if (this.currentToken instanceof Lexer.ModToken) {
        this.currentToken = this.eat(Lexer.ModToken);
        current = new AST.ModAST(current, this.power()).inheritPositionFrom(
          savedToken,
        );
      }
    }

    return current;
  }

  private power(): AST.AST {
    let current = this.atom();

    while (this.currentToken instanceof Lexer.ExponentiationToken) {
      const exponentiationToken = Object.assign({}, this.currentToken);
      this.currentToken = this.eat(Lexer.ExponentiationToken);
      current = new AST.ExponentiationAST(
        current,
        this.atom(),
      ).inheritPositionFrom(exponentiationToken);
    }

    return current;
  }

  private atom(): AST.AST {
    const savedToken = Object.assign({}, this.currentToken);

    if (this.currentToken instanceof Lexer.PlusToken) {
      this.currentToken = this.eat(Lexer.PlusToken);
      return new AST.UnaryPlusAST(this.atom()).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.MinusToken) {
      this.currentToken = this.eat(Lexer.MinusToken);
      return new AST.UnaryMinusAST(this.atom()).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.IntegerConstToken) {
      const value = this.currentToken.value;
      this.currentToken = this.eat(Lexer.IntegerConstToken);
      return new AST.IntegerConstantAST(value).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.RealConstToken) {
      const value = this.currentToken.value;
      this.currentToken = this.eat(Lexer.RealConstToken);
      return new AST.RealConstantAST(value).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.OpeningParenthesisToken) {
      this.currentToken = this.eat(Lexer.OpeningParenthesisToken);
      const result = this.expression();
      this.currentToken = this.eat(Lexer.ClosingParenthesisToken);
      return result;
    } else if (this.currentToken instanceof Lexer.TrueToken) {
      this.currentToken = this.eat(Lexer.TrueToken);
      return new AST.TrueConstantAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.FalseToken) {
      this.currentToken = this.eat(Lexer.FalseToken);
      return new AST.FalseConstantAST().inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.StringConstantToken) {
      const str = this.currentToken.value;
      this.currentToken = this.eat(Lexer.StringConstantToken);
      return new AST.StringConstantAST(str).inheritPositionFrom(savedToken);
    } else if (this.currentToken instanceof Lexer.NotToken) {
      this.currentToken = this.eat(Lexer.NotToken);
      return new AST.NotAST(this.atom()).inheritPositionFrom(savedToken);
    } else if (
      this.currentToken instanceof Lexer.IdToken &&
      this.peek() instanceof Lexer.OpeningBracketToken
    ) {
      return this.arrayAccess();
    } else if (
      this.currentToken instanceof Lexer.IdToken &&
      this.peek() instanceof Lexer.OpeningParenthesisToken
    ) {
      return this.callFunction();
    } else if (this.currentToken instanceof Lexer.IdToken) {
      return this.variable();
    } else {
      throw new GLOError(savedToken, 'Μη έγκυρος παράγοντας έκφρασης');
    }
  }

  private callFunction() {
    const nameAST = this.variable();
    const name = nameAST.name;

    this.currentToken = this.eat(Lexer.OpeningParenthesisToken);

    const args: AST.AST[] = [];

    if (!(this.currentToken instanceof Lexer.ClosingParenthesisToken)) {
      args.push(this.expression());

      while (this.currentToken instanceof Lexer.CommaToken) {
        this.currentToken = this.eat(Lexer.CommaToken);

        if (this.currentToken instanceof Lexer.ClosingParenthesisToken) {
          throw new GLOError(
            this.previousToken!,
            'Περίμενα έκφραση μετά το κόμμα στο κάλεσμα συνάρτησης',
          );
        }

        args.push(this.expression());
      }
    }

    this.currentToken = this.eat(
      Lexer.ClosingParenthesisToken,
      'Περίμενα κλείσιμο παρένθεσης μετά από παραμέτρους συνάρτησης',
      true,
    );

    return new AST.FunctionCallAST(name, args).inheritPositionFrom(nameAST);
  }

  private callProcedure() {
    this.currentToken = this.eat(Lexer.CallToken);

    const nameAST = this.variable();
    const name = nameAST.name;

    this.currentToken = this.eat(
      Lexer.OpeningParenthesisToken,
      'Περίμενα άνοιγμα παρένθεσης μετά από όνομα διαδικασίας',
      this.currentToken instanceof Lexer.NewLineToken,
    );

    const args: AST.AST[] = [];

    if (
      !(this.currentToken instanceof Lexer.ClosingParenthesisToken) &&
      !(this.currentToken instanceof Lexer.NewLineToken)
    ) {
      args.push(this.expression());

      while (this.currentToken instanceof Lexer.CommaToken) {
        this.currentToken = this.eat(Lexer.CommaToken);

        if (this.currentToken instanceof Lexer.ClosingParenthesisToken) {
          throw new GLOError(
            this.previousToken!,
            'Περίμενα έκφραση μετά το κόμμα στο κάλεσμα διαδικασίας',
          );
        }

        args.push(this.expression());
      }
    }

    this.currentToken = this.eat(
      Lexer.ClosingParenthesisToken,
      'Περίμενα κλείσιμο παρένθεσης μετά από παραμέτρους διαδικασίας',
      this.currentToken instanceof Lexer.NewLineToken,
    );

    return new AST.ProcedureCallAST(name, args).inheritPositionFrom(nameAST);
  }

  public run() {
    const node = this.program();
    this.currentToken = this.eat(Lexer.EofToken);
    return node;
  }
}
