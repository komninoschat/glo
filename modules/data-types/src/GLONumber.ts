import GLODataType from './GLODataType';

/**
 * Only used in Pseudoglossa
 */
export default class GLONumber extends GLODataType {
  public static readonly PRECISION = 2;
  private internalValue: string;

  public isInteger() {
    return Number.isInteger(parseFloat(this.internalValue));
  }

  private get floatValue() {
    return parseFloat(this.internalValue);
  }

  private get integerValue() {
    return parseInt(this.internalValue);
  }

  public get value() {
    return this.isPositiveInfinity
      ? Infinity
      : this.isNegativeInfinity
      ? -Infinity
      : this.isInteger()
      ? this.integerValue
      : this.floatValue;
  }

  public isPositiveInfinity = false;
  public isNegativeInfinity = false;

  constructor(value: number) {
    super();

    if (value === Number.POSITIVE_INFINITY) {
      this.isPositiveInfinity = true;
      this.internalValue = '';
    } else if (value === Number.NEGATIVE_INFINITY) {
      this.isNegativeInfinity = true;
      this.internalValue = '';
    }

    // Hack to avoid toFixed rounding: Add one more digit and remove after string conversion
    else
      this.internalValue = value.toFixed(GLONumber.PRECISION + 1).slice(0, -1);
  }

  public serialize() {
    return this.value;
  }

  public print(): string {
    return this.value.toString();
  }

  public add(right: GLONumber): GLONumber {
    return new GLONumber(this.value + right.value);
  }
  public subtract(right: GLONumber): GLONumber {
    return new GLONumber(this.value - right.value);
  }
  public multiply(right: GLONumber): GLONumber {
    return new GLONumber(this.value * right.value);
  }
  public divide(right: GLONumber): GLONumber {
    return new GLONumber(this.value / right.value);
  }
  public exponent(right: GLONumber): GLONumber {
    return new GLONumber(Math.pow(this.value, right.value));
  }
  public equals(right: GLONumber): boolean {
    return this.value == right.value;
  }
  public notEquals(right: GLONumber): boolean {
    return this.value != right.value;
  }
  public lessThan(right: GLONumber): boolean {
    return this.value < right.value;
  }
  public greaterThan(right: GLONumber): boolean {
    return this.value > right.value;
  }
  public lessEqualsThan(right: GLONumber): boolean {
    return this.value <= right.value;
  }
  public greaterEqualsThan(right: GLONumber): boolean {
    return this.value >= right.value;
  }
  public unaryPlus(): GLONumber {
    return new GLONumber(this.value);
  }
  public unaryMinus(): GLONumber {
    return new GLONumber(-this.value);
  }

  public integerDivide(right: GLONumber): GLONumber {
    return new GLONumber(Math.trunc(this.value / right.value));
  }
  public mod(right: GLONumber): GLONumber {
    return new GLONumber(this.value % right.value);
  }
}
