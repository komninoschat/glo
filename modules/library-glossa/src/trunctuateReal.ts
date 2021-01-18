import { GLODataType, GLOInteger, GLOReal } from '@glossa-glo/data-types';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'Α_Μ',
  [{ args: [['τιμή', GLOReal]], returnType: GLOInteger }],
  (args: GLODataType[]) => {
    const value = (args[0] as GLOReal).value;

    return new GLOInteger(Math.trunc(value));
  },
);
