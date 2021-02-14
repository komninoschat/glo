import * as Token from './token';
import CaseInsensitiveMap from '@glossa-glo/case-insensitive-map';
import * as Types from '@glossa-glo/data-types';
import GLOError, { DebugInfoProvider } from '@glossa-glo/error';

export enum Mode {
  Glossa = 'glossa',
  Pseudoglossa = 'pseudoglossa',
}

export class Lexer {
  public static readonly sharedReservedKeywords = new CaseInsensitiveMap<
    string,
    () => Token.Token
  >([
    ['DIV', () => new Token.IntegerDivisionToken()],
    ['ΑΛΗΘΗΣ', () => new Token.TrueToken()],
    ['ΨΕΥΔΗΣ', () => new Token.FalseToken()],
    ['ΑΝ', () => new Token.IfToken()],
    ['ΤΟΤΕ', () => new Token.ThenToken()],
    ['ΑΛΛΙΩΣ', () => new Token.ElseToken()],
    ['ΚΑΙ', () => new Token.AndToken()],
    ['Η', () => new Token.OrToken()],
    ['ΟΧΙ', () => new Token.NotToken()],
    ['ΓΙΑ', () => new Token.ForToken()],
    ['TO', () => new Token.ToToken()],
    ['ΑΠΟ', () => new Token.FromToken()],
    ['ΜΕΧΡΙ', () => new Token.ToToken()],
    ['ΕΠΑΝΑΛΑΒΕ', () => new Token.DoToken()],
    ['ΟΣΟ', () => new Token.WhileToken()],

    ['ΜΕΧΡΙΣ_ΟΤΟΥ', () => new Token.UntilToken()],
    ['ΤΕΛΟΣ_ΕΠΑΝΑΛΗΨΗΣ', () => new Token.LoopEndToken()],
    ['ΜΕ_ΒΗΜΑ', () => new Token.WithStepToken()],
    ['ΔΙΑΒΑΣΕ', () => new Token.ReadToken()],
    ['ΓΡΑΨΕ', () => new Token.WriteToken()],
    ['ΑΛΛΙΩΣ_ΑΝ', () => new Token.ElseIfToken()],
    ['ΤΕΛΟΣ_ΑΝ', () => new Token.EndIfToken()],
    ['ΕΠΙΛΕΞΕ', () => new Token.SelectToken()],
    ['ΠΕΡΙΠΤΩΣΗ', () => new Token.CaseToken()],
    ['ΤΕΛΟΣ_ΕΠΙΛΟΓΩΝ', () => new Token.SelectEndToken()],
    ['MOD', () => new Token.ModToken()],
  ]);

  public static readonly glossaReservedKeywords = new CaseInsensitiveMap<
    string,
    () => Token.Token
  >([
    ['ΑΡΧΗ', () => new Token.BeginToken()],
    ['ΠΡΟΓΡΑΜΜΑ', () => new Token.ProgramToken()],
    ['ΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ', () => new Token.ProgramEndToken()],
    ['ΣΤΑΘΕΡΕΣ', () => new Token.ConstantToken()],
    ['ΜΕΤΑΒΛΗΤΕΣ', () => new Token.VariableToken()],
    ['ΑΚΕΡΑΙΕΣ', () => new Token.IntegerToken()],
    ['ΠΡΑΓΜΑΤΙΚΕΣ', () => new Token.RealToken()],
    ['ΛΟΓΙΚΕΣ', () => new Token.BooleanToken()],
    ['ΧΑΡΑΚΤΗΡΕΣ', () => new Token.StringToken()],
    ['ΔΙΑΔΙΚΑΣΙΑ', () => new Token.ProcedureToken()],
    ['ΣΥΝΑΡΤΗΣΗ', () => new Token.FunctionToken()],
    ['ΤΕΛΟΣ_ΣΥΝΑΡΤΗΣΗΣ', () => new Token.FunctionEndToken()],
    ['ΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ', () => new Token.ProcedureEndToken()],
    ['ΑΚΕΡΑΙΑ', () => new Token.IntegerSingularToken()],
    ['ΠΡΑΓΜΑΤΙΚΗ', () => new Token.RealSingularToken()],
    ['ΛΟΓΙΚΗ', () => new Token.BooleanSingularToken()],
    ['ΧΑΡΑΚΤΗΡΑΣ', () => new Token.StringSingularToken()],
    ['ΚΑΛΕΣΕ', () => new Token.CallToken()],
    ['ΑΡΧΗ_ΕΠΑΝΑΛΗΨΗΣ', () => new Token.RepeatToken()],
  ]);

  public static readonly pseudoglossaReservedKeywords = new CaseInsensitiveMap<
    string,
    () => Token.Token
  >([
    ['ΑΛΓΟΡΙΘΜΟΣ', () => new Token.AlgorithmToken()],
    ['ΤΕΛΟΣ', () => new Token.EndToken()],
    ['ΕΚΤΥΠΩΣΕ', () => new Token.PrintToken()],
    ['ΕΜΦΑΝΙΣΕ', () => new Token.ShowToken()],
    ['ΑΝΤΙΜΕΤΑΘΕΣΕ', () => new Token.SwapToken()],
    ['ΔΕΔΟΜΕΝΑ', () => new Token.DataToken()],
    ['ΑΠΟΤΕΛΕΣΜΑΤΑ', () => new Token.ResultsToken()],
  ]);

  private readonly numberRegex = /^\d$/;
  private readonly idFirstCharacterRegex = /^[α-ωΑ-ΩίϊΐόάέύϋΰήώΊΪΪ́ΌΆΈΎΫΫ́ΉΏa-zA-Z_]$/;
  private readonly idRegex = /^[α-ωΑ-ΩίϊΐόάέύϋΰήώΊΪΪ́ΌΆΈΎΫΫ́ΉΏa-zA-Z0-9_]$/;
  private readonly whitespaceRegex = /^[^\S\n]$/;

  private sourceCode: string;
  private position: number;

  private get currentCharacter(): string | null {
    if (this.position >= this.sourceCode.length) {
      return null;
    } else {
      return this.sourceCode[this.position];
    }
  }

  public get linePosition(): number {
    return this.sourceCode.slice(0, this.position).split('\n').length - 1;
  }

  public get characterPosition(): number {
    const lastNewline = this.sourceCode
      .slice(0, this.position)
      .lastIndexOf('\n');

    return lastNewline !== -1 ? this.position - lastNewline - 1 : this.position;
  }

  private getPositionMinus(a: number) {
    this.position -= a;
    const position = {
      linePosition: this.linePosition,
      characterPosition: this.characterPosition,
    };
    this.position += a;
    return position;
  }

  constructor(sourceCode: string, public readonly mode: Mode) {
    this.sourceCode = sourceCode;
    this.position = 0;
  }

  private peek(length = 1) {
    const peekPosition = this.position + length;

    if (peekPosition >= this.sourceCode.length) {
      return null;
    } else {
      return this.sourceCode.substring(this.position + 1, peekPosition + 1);
    }
  }

  private advance(length = 1) {
    this.position += length;
  }

  private whitespace() {
    while (
      this.currentCharacter !== null &&
      this.currentCharacter.match(this.whitespaceRegex)
    ) {
      this.advance();
    }
  }

  private comment() {
    while (this.currentCharacter != '\n' && this.currentCharacter != null) {
      this.advance();
    }
  }

  private number() {
    const startPosition = {
      linePosition: this.linePosition,
      characterPosition: this.characterPosition,
    };

    let number = '';
    while (
      this.currentCharacter !== null &&
      this.currentCharacter.match(this.numberRegex)
    ) {
      number += this.currentCharacter;
      this.advance();
    }

    if (
      this.currentCharacter == '.' &&
      this.peek() != '.' // Fix conflicts with integer subrange type
    ) {
      number += this.currentCharacter;
      this.advance();
      while (
        this.currentCharacter !== null &&
        this.currentCharacter.match(this.numberRegex)
      ) {
        number += this.currentCharacter;
        this.advance();
      }
      if (this.mode === Mode.Pseudoglossa)
        return new Token.NumberConstToken(
          new Types.GLONumber(parseFloat(number)),
        )
          .inheritStartPositionFrom(startPosition)
          .inheritEndPositionFrom(this);
      else
        return new Token.RealConstToken(new Types.GLOReal(parseFloat(number)))
          .inheritStartPositionFrom(startPosition)
          .inheritEndPositionFrom(this);
    } else {
      if (this.mode === Mode.Pseudoglossa)
        return new Token.NumberConstToken(
          new Types.GLONumber(parseFloat(number)),
        )
          .inheritStartPositionFrom(startPosition)
          .inheritEndPositionFrom(this);
      else
        return new Token.IntegerConstToken(
          new Types.GLOInteger(parseInt(number)),
        )
          .inheritStartPositionFrom(startPosition)
          .inheritEndPositionFrom(this);
    }
  }

  private id() {
    const startPosition = {
      linePosition: this.linePosition,
      characterPosition: this.characterPosition,
    };
    let id = '';
    while (
      this.currentCharacter !== null &&
      this.currentCharacter.match(this.idRegex)
    ) {
      id += this.currentCharacter;
      this.advance();
    }
    if (Lexer.sharedReservedKeywords.has(id)) {
      return (Lexer.sharedReservedKeywords.get(id) as () => Token.Token)()
        .inheritStartPositionFrom(startPosition)
        .inheritEndPositionFrom(this);
    } else if (
      this.mode === Mode.Glossa &&
      Lexer.glossaReservedKeywords.has(id)
    ) {
      return (Lexer.glossaReservedKeywords.get(id) as () => Token.Token)()
        .inheritStartPositionFrom(startPosition)
        .inheritEndPositionFrom(this);
    } else if (
      this.mode === Mode.Pseudoglossa &&
      Lexer.pseudoglossaReservedKeywords.has(id)
    ) {
      return (Lexer.pseudoglossaReservedKeywords.get(id) as () => Token.Token)()
        .inheritStartPositionFrom(startPosition)
        .inheritEndPositionFrom(this);
    } else {
      return new Token.IdToken(id)
        .inheritStartPositionFrom(startPosition)
        .inheritEndPositionFrom(this);
    }
  }

  private stringConstant(terminator: string) {
    let str = '';

    const startPosition = new DebugInfoProvider([
      [this.linePosition, this.characterPosition - 1],
      [this.linePosition, this.characterPosition],
    ]);

    while (this.currentCharacter != terminator) {
      if (this.currentCharacter === '\n' || this.currentCharacter === null) {
        throw new GLOError(startPosition, 'Η σταθερά χαρακτήρων δεν τελειώνει');
      }

      str += this.currentCharacter;
      this.advance();
    }

    this.advance();

    return new Token.StringConstantToken(new Types.GLOString(str))
      .inheritStartPositionFrom(startPosition.start)
      .inheritEndPositionFrom(this);
  }

  public peekNextToken(): Token.Token {
    const oldPosition = this.position;
    const oldCurrentCharacter = this.currentCharacter;
    const token = this.getNextToken();
    this.position = oldPosition;
    return token;
  }

  public getNextToken(): Token.Token {
    while (this.currentCharacter != null) {
      if (this.currentCharacter.match(this.whitespaceRegex)) {
        this.whitespace();
        continue;
      } else if (this.currentCharacter == '!') {
        this.comment();
        continue;
      } else if (this.currentCharacter == '<' && this.peek() == '-') {
        this.advance(2);
        return new Token.AssignToken()
          .inheritStartPositionFrom(this.getPositionMinus(2))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '\n') {
        this.advance();

        const savedPosition = this.position;
        const nextToken = this.getNextToken();

        if (nextToken instanceof Token.LineMergeToken) {
          throw new GLOError(
            nextToken,
            'Ο τελεστής & δεν υποστηρίζεται από τον διερμηνευτή',
          );
        }

        this.position = savedPosition;

        return new Token.NewLineToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '&') {
        this.advance();
        return new Token.LineMergeToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '+') {
        this.advance();
        return new Token.PlusToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '-') {
        this.advance();
        return new Token.MinusToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '*') {
        this.advance();
        return new Token.MultiplicationToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '/') {
        this.advance();
        if (this.currentCharacter == '/') {
          this.advance();
          return new Token.DoubleSlashToken()
            .inheritStartPositionFrom(this.getPositionMinus(2))
            .inheritEndPositionFrom(this);
        } else
          return new Token.RealDivisionToken()
            .inheritStartPositionFrom(this.getPositionMinus(1))
            .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '(') {
        this.advance();
        return new Token.OpeningParenthesisToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == ')') {
        this.advance();
        return new Token.ClosingParenthesisToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '.') {
        this.advance();
        if (this.currentCharacter == '.') {
          this.advance();
          return new Token.DoubleDotToken()
            .inheritStartPositionFrom(this.getPositionMinus(2))
            .inheritEndPositionFrom(this);
        } else {
          return new Token.DotToken()
            .inheritStartPositionFrom(this.getPositionMinus(1))
            .inheritEndPositionFrom(this);
        }
      } else if (this.currentCharacter == ':') {
        this.advance();
        return new Token.ColonToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == ',') {
        this.advance();
        return new Token.CommaToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '=') {
        this.advance();
        return new Token.EqualsToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '<' && this.peek() == '>') {
        this.advance(2);
        return new Token.NotEqualsToken()
          .inheritStartPositionFrom(this.getPositionMinus(2))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '>' && this.peek() == '=') {
        this.advance(2);
        return new Token.GreaterEqualsToken()
          .inheritStartPositionFrom(this.getPositionMinus(2))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '<' && this.peek() == '=') {
        this.advance(2);
        return new Token.LessEqualsToken()
          .inheritStartPositionFrom(this.getPositionMinus(2))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '>') {
        this.advance();
        return new Token.GreaterThanToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '<') {
        this.advance();
        return new Token.LessThanToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == '[') {
        this.advance();
        return new Token.OpeningBracketToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == ']') {
        this.advance();
        return new Token.ClosingBracketToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter == "'" || this.currentCharacter == '"') {
        const stringTerminator = this.currentCharacter;
        this.advance();
        return this.stringConstant(stringTerminator);
      } else if (this.currentCharacter == '^') {
        this.advance();
        return new Token.ExponentiationToken()
          .inheritStartPositionFrom(this.getPositionMinus(1))
          .inheritEndPositionFrom(this);
      } else if (this.currentCharacter.match(this.numberRegex)) {
        return this.number();
      } else if (this.currentCharacter.match(this.idFirstCharacterRegex)) {
        return this.id();
      } else {
        throw new GLOError(
          new DebugInfoProvider([
            [this.linePosition, this.characterPosition],
            [this.linePosition, this.characterPosition + 1],
          ]),
          `Μη δεκτός χαρακτήρας '${this.currentCharacter}'`,
        );
      }
    }

    return new Token.EofToken().inheritPositionFrom({
      start: this,
      end: this,
    });
  }
}

export * from './token';
