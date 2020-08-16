import {
  PSIDataType,
  PSIBoolean,
  PSIBooleanType,
  PSICharType,
  PSIInteger,
  PSIIntegerType,
  PSIChar,
  PSIProcedure,
  PSIProcedureType,
  PSIReal,
  PSIRealType,
  PSIVoid,
} from './PSIDataTypes';

export default function printType(
  type: new (..._: any[]) => PSIDataType,
): string {
  if (((type as unknown) as typeof PSIDataType).isArrayType) return `Array`;
  else if (type === PSIBoolean) return 'Boolean';
  else if (type === PSIBooleanType) return 'Boolean Type';
  else if (type === PSIChar) return 'Char';
  else if (type === PSICharType) return 'Char Type';
  else if (type === PSIInteger) return 'Integer';
  else if (type === PSIIntegerType) return 'Integer Type';
  else if (type === PSIProcedure) return 'Procedure';
  else if (type === PSIProcedureType) return 'Procedure Type';
  else if (type === PSIReal) return 'Real';
  else if (type === PSIRealType) return 'Real Type';
  else if (((type as unknown) as typeof PSIDataType).isSubrangeType)
    return `Subrange Of ${printType((type as any).treatAs)}`;
  else if (type === PSIVoid) return 'Void';
  else throw new Error('Attempted to print unknown type');
}