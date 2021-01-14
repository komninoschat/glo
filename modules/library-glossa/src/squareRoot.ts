import { GLODataType, GLOReal } from '@glossa-glo/data-types';
import GLOError from '@glossa-glo/error';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'Τ_Ρ',
  [{ args: [['τιμή', GLOReal]], returnType: GLOReal }],
  (args, argDebugInfoProviders) => {
    const value = (args[0] as GLOReal).value;

    if (value < 0) {
      throw new GLOError(
        argDebugInfoProviders[0],
        'Δεν επιτρέπεται αρνητική παράμετρος στη συνάρτηση Τ_Ρ',
      );
    }

    return new GLOReal(Math.sqrt(value));
  },
);
