import { GLODataType, GLONumber } from '@glossa-glo/data-types';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'ΕΦ',
  [{ args: [['μοίρες', GLONumber]], returnType: GLONumber }],
  (args: GLODataType[]) => {
    const value = (args[0] as GLONumber).value;

    const degrees = (value * Math.PI) / 180;

    return new GLONumber(Math.tan(degrees));
  },
);
