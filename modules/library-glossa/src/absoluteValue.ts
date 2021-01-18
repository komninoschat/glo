import { GLODataType, GLOInteger, GLOReal } from '@glossa-glo/data-types';
import GLOError from '@glossa-glo/error';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'Α_Τ',
  [
    // The ordering here matters, as GLOInteger is promotable to GLOReal!!
    { args: [['τιμή', GLOInteger]], returnType: GLOInteger },
    { args: [['τιμή', GLOReal]], returnType: GLOReal },
  ],
  (args) => {
    const value = (args[0] as GLOReal | GLOInteger).value;

    return args[0] instanceof GLOInteger
      ? new GLOInteger(Math.abs(value))
      : new GLOReal(Math.abs(value));
  },
);
