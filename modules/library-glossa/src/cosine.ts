import { GLODataType, GLOReal } from '@glossa-glo/data-types';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'ΣΥΝ',
  [{ args: [['μοίρες', GLOReal]], returnType: GLOReal }],
  (args) => {
    const value = (args[0] as GLOReal).value;

    const degrees = (value * Math.PI) / 180;

    return new GLOReal(Math.cos(degrees));
  },
);
