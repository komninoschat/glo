import {
  GLODataType,
  GLOBoolean,
  GLOInteger,
  GLOString,
  GLOProcedure,
  GLOReal,
  GLOVoid,
  GLOFunction,
  GLOSubrange,
} from '.';
import GLONumber from './GLONumber';

export default function printType(type: typeof GLODataType): string {
  if (type && type.multitype) return type.multitype.map(printType).join(' ή ');
  else if (type && type.isArrayType)
    return `Πίνακας από ${printType((type as any).componentType)} ${
      (type as any).dimensionLength.length
    } ${
      (type as any).dimensionLength.length === 1 ? 'διάστασης' : 'διαστάσεων'
    }`;
  else if (type === GLOBoolean) return 'Λογική';
  else if (type === GLOString) return 'Χαρακτήρες';
  else if (type === GLOInteger) return 'Ακέραια';
  else if (type === GLOProcedure) return 'Διαδικασία';
  else if (type === GLOFunction) return 'Συνάρτηση';
  else if (type === GLOReal) return 'Πραγματική';
  else if (type === GLOSubrange) return 'Εύρος';
  else if (type === GLOVoid) return 'Κενό';
  else if (type === GLONumber) return 'Αριθμός';
  else return `Άγνωστο`;
}
