import { GLODataType, GLONumber } from '@glossa-glo/data-types';
import GLOError from '@glossa-glo/error';
import { LibraryFunction } from '@glossa-glo/library';

export default new LibraryFunction(
  'Τ_Ρ',
  [{ args: [['τιμή', GLONumber]], returnType: GLONumber }],
  (args, argDebugInfoProviders) => {
    const value = (args[0] as GLONumber).value;

    if (value < 0) {
      throw new GLOError(
        argDebugInfoProviders[0],
        'Δεν επιτρέπεται αρνητική παράμετρος στη συνάρτηση Τ_Ρ',
      );
    }

    return new GLONumber(Math.sqrt(value));
  },
);
