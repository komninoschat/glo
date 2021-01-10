import { GLODataType, GLONumber } from '@glossa-glo/data-types';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'Α_Μ',
  [{ args: [['τιμή', GLONumber]], returnType: GLONumber }],
  (args: GLODataType[]) => {
    const value = (args[0] as GLONumber).value;

    return new GLONumber(Math.trunc(value));
  },
);
