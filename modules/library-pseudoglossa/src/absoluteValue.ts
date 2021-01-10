import { GLODataType, GLONumber } from '@glossa-glo/data-types';
import GLOError from '@glossa-glo/error';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'Α_Τ',
  [
    // The ordering here matters, as GLOInteger is promotable to GLOReal!!
    { args: [['τιμή', GLONumber]], returnType: GLONumber },
  ],
  args => {
    const value = (args[0] as GLONumber).value;

    return new GLONumber(Math.abs(value));
  },
);
