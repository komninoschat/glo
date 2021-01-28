import GLOError from '@glossa-glo/error';

interface GLODataType {
  add(right: GLODataType): GLODataType;
  subtract(right: GLODataType): GLODataType;
  multiply(right: GLODataType): GLODataType;
  divide(right: GLODataType): GLODataType;
  integerDivide(right: GLODataType): GLODataType;
  exponent(right: GLODataType): GLODataType;
  mod(right: GLODataType): GLODataType;
  equals(right: GLODataType): boolean;
  notEquals(right: GLODataType): boolean;
  lessThan(right: GLODataType): boolean;
  greaterThan(right: GLODataType): boolean;
  lessEqualsThan(right: GLODataType): boolean;
  greaterEqualsThan(right: GLODataType): boolean;
  unaryPlus(): GLODataType;
  unaryMinus(): GLODataType;
}

abstract class GLODataType {
  constructor(..._: any[]) {}

  public static defaultValue?: GLODataType;

  public static multitype?: typeof GLODataType[];

  public static isArrayType = false;
  public isArray = false;

  public promote?: Map<typeof GLODataType, () => GLODataType>;

  public abstract print(): string;

  public static promotable?: typeof GLODataType[];

  add(right: GLODataType): GLODataType {
    throw new Error(
      `Program error: Cannot perform add operation with type ${this.constructor.name}`,
    );
  }
  subtract(right: GLODataType): GLODataType {
    throw new Error(
      `Program error: Cannot perform subtract operation with type ${this.constructor.name}`,
    );
  }
  multiply(right: GLODataType): GLODataType {
    throw new Error(
      `Program error: Cannot perform multiply operation with type ${this.constructor.name}`,
    );
  }
  divide(right: GLODataType): GLODataType {
    throw new Error(
      `Program error: Cannot perform divide operation with type ${this.constructor.name}`,
    );
  }
  integerDivide(right: GLODataType): GLODataType {
    throw new Error(
      `Program error: Cannot perform integerDivide operation with type ${this.constructor.name}`,
    );
  }
  exponent(right: GLODataType): GLODataType {
    throw new Error(
      `Program error: Cannot perform exponent operation with type ${this.constructor.name}`,
    );
  }
  mod(right: GLODataType): GLODataType {
    throw new Error(
      `Program error: Cannot perform mod operation with type ${this.constructor.name}`,
    );
  }
  equals(right: GLODataType): boolean {
    throw new Error(
      `Program error: Cannot perform equals operation with type ${this.constructor.name}`,
    );
  }
  notEquals(right: GLODataType): boolean {
    throw new Error(
      `Program error: Cannot perform notEquals operation with type ${this.constructor.name}`,
    );
  }
  lessThan(right: GLODataType): boolean {
    throw new Error(
      `Program error: Cannot perform lessThan operation with type ${this.constructor.name}`,
    );
  }
  greaterThan(right: GLODataType): boolean {
    throw new Error(
      `Program error: Cannot perform greaterThan operation with type ${this.constructor.name}`,
    );
  }
  lessEqualsThan(right: GLODataType): boolean {
    throw new Error(
      `Program error: Cannot perform lessEqualsThan operation with type ${this.constructor.name}`,
    );
  }
  greaterEqualsThan(right: GLODataType): boolean {
    throw new Error(
      `Program error: Cannot perform greaterEqualsThan operation with type ${this.constructor.name}`,
    );
  }
  unaryPlus(): GLODataType {
    throw new Error(
      `Program error: Cannot perform unaryPlus operation with type ${this.constructor.name}`,
    );
  }
  unaryMinus(): GLODataType {
    throw new Error(
      `Program error: Cannot perform unaryMinus operation with type ${this.constructor.name}`,
    );
  }
}

export default GLODataType;
