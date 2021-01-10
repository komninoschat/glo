import { Token } from '.';
import * as Types from '@glossa-glo/data-types';

export default class NumberConstToken extends Token {
  public readonly value: Types.GLONumber;

  constructor(value: Types.GLONumber) {
    super();
    this.value = value;
  }
}
