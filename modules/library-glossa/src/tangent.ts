import { GLODataType, GLOReal } from '@glossa-glo/data-types';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'ΕΦ',
  [{ args: [['μοίρες', GLOReal]], returnType: GLOReal }],
  (args: GLODataType[]) => {
    const value = (args[0] as GLOReal).value;

    const degrees = (value * Math.PI) / 180;

    return new GLOReal(Math.tan(degrees));
  },
);
