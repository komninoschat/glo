import deepEqual from 'deep-equal';

export class DebugInfoProvider {
  start = {
    linePosition: -1,
    characterPosition: -1,
  };
  end = {
    linePosition: -1,
    characterPosition: -1,
  };

  constructor(info?: [[number, number], [number, number]]) {
    if (info) {
      this.start.linePosition = info[0][0];
      this.start.characterPosition = info[0][1];
      this.end.linePosition = info[1][0];
      this.end.characterPosition = info[1][1];
    }
  }

  public setPosition(line: number, character: number, type: 'start' | 'end') {
    this[type].linePosition = line;
    this[type].characterPosition = character;
    return this;
  }

  public inheritStartPositionFrom(positionProvider: {
    linePosition: number;
    characterPosition: number;
  }) {
    this.start.linePosition = positionProvider.linePosition;
    this.start.characterPosition = positionProvider.characterPosition;
    return this;
  }

  public inheritEndPositionFrom(positionProvider: {
    linePosition: number;
    characterPosition: number;
  }) {
    this.end.linePosition = positionProvider.linePosition;
    this.end.characterPosition = positionProvider.characterPosition;
    return this;
  }

  public inheritPositionFrom(fullPositionProvider: {
    start: {
      linePosition: number;
      characterPosition: number;
    };
    end: {
      linePosition: number;
      characterPosition: number;
    };
  }) {
    this.start.linePosition = fullPositionProvider.start.linePosition;
    this.start.characterPosition = fullPositionProvider.start.characterPosition;

    this.end.linePosition = fullPositionProvider.end.linePosition;
    this.end.characterPosition = fullPositionProvider.end.characterPosition;

    return this;
  }
}

export enum GLOErrorType {
  LexerError = 'LexerError',
  ParserError = 'ParserError',
}

export default class GLOError extends DebugInfoProvider {
  message: string;

  constructor(
    private readonly debugInfoProvider: DebugInfoProvider,
    message: string,
  ) {
    super([
      [
        debugInfoProvider.start.linePosition,
        debugInfoProvider.start.characterPosition,
      ],
      [
        debugInfoProvider.end.linePosition,
        debugInfoProvider.end.characterPosition,
      ],
    ]);
    this.message = message;
    this.start = debugInfoProvider.start;
    this.end = debugInfoProvider.end;
  }
}

export function assert(
  debugInfoProvider: DebugInfoProvider,
  cond: any,
  message: string,
) {
  if (!cond) {
    throw new GLOError(debugInfoProvider, message);
  }
}

export function assertEquality(
  debugInfoProvider: DebugInfoProvider,
  obj1: any,
  obj2: any,
  message: string,
) {
  if (!deepEqual(obj1, obj2)) {
    throw new GLOError(debugInfoProvider, message);
  }
}
