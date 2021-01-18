import { GLODataType, GLONumber } from '@glossa-glo/data-types';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'Ε',
  [{ args: [['τιμή', GLONumber]], returnType: GLONumber }],
  (args) => {
    const value = (args[0] as GLONumber).value;

    return new GLONumber(Math.exp(value));
  },
);
