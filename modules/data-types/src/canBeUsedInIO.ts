import { GLOBoolean, GLODataType, GLOInteger, GLOReal, GLOString } from '.';
import GLONumber from './GLONumber';

export function canBeRead(type: typeof GLODataType) {
  if (
    type === GLOInteger ||
    type === GLOReal ||
    type === GLOString ||
    type === GLONumber
  ) {
    return true;
  } else {
    return false;
  }
}

export function canBeWritten(type: typeof GLODataType) {
  if (
    type === GLOBoolean ||
    type === GLOInteger ||
    type === GLOReal ||
    type === GLOString ||
    type === GLONumber
  ) {
    return true;
  } else {
    return false;
  }
}
