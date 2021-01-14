import { GLODataType, GLOInteger } from '.';
import GLOType from './GLOType';

export function isGLOArray(
  dataType: GLODataType,
): dataType is GLODataType & GLOArrayLike {
  return dataType.isArray;
}

export interface GLOArrayLike {
  value: any;
  changeValue(keys: GLODataType[], value: GLODataType): void;
  getValue(keys: GLODataType[]): GLODataType | undefined;
}

export default function createGLOArray(
  componentType: typeof GLOType,
  dimensionLength: number[],
) {
  return class GLOArray extends GLODataType implements GLOArrayLike {
    public static isArrayType = true;
    public isArray = true;
    public static componentType = componentType;
    public static dimensionLength = dimensionLength;
    public dimensionLength = dimensionLength;

    public static defaultValue = new GLOArray();

    public readonly value: any;

    // Cannot use name print as it is used
    // To determine whether the data type
    // can be written with the write command
    // TODO: Make more efficient, allow n-dimensional arrays
    arrayPrint() {
      if (this.dimensionLength.length === 1) {
        let arr;
        if (this.dimensionLength[0] !== Number.POSITIVE_INFINITY) {
          arr = new Array(this.dimensionLength[0] + 1);
          for (let i = 1; i <= this.dimensionLength[0]; i++) {
            if (this.value[i] instanceof GLODataType) {
              arr[i] = this.value[i].print();
            }
          }
        } else {
          // const maxIndex = Object.keys(this.value)
          arr = [];
        }
        return arr;
      } else if (this.dimensionLength.length === 2) {
        let arr;
        if (this.dimensionLength[0] !== Number.POSITIVE_INFINITY) {
          arr = new Array(this.dimensionLength[0] + 1);
          for (let i = 1; i <= this.dimensionLength[0]; i++) {
            arr[i] = new Array(this.dimensionLength[1] + 1);
            for (let j = 1; j <= this.dimensionLength[1]; j++) {
              if (this.value[i] && this.value[i][j] instanceof GLODataType) {
                arr[i][j] = this.value[i][j].print();
              }
            }
          }
        } else {
          arr = [];
        }
        return arr;
      } else {
        return [];
      }
    }

    constructor() {
      super();
      this.value = {};
    }

    public print(): string {
      throw new Error('Program error: Cannot print array');
    }

    public changeValue(keys: GLOInteger[], value: GLODataType) {
      let current = this.value;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const serialized = key.serialize();
        if (!current.hasOwnProperty(serialized)) {
          current[serialized] = {};
        }
        current = current[serialized];
      }

      current[keys[keys.length - 1].serialize()] = value;
    }

    public getValue(keys: GLOInteger[]) {
      let current = this.value;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const serialized = key.serialize();
        if (!current.hasOwnProperty(serialized)) {
          return undefined;
        }
        current = current[serialized];
      }

      return current[keys[keys.length - 1].serialize()];
    }
  };
}
