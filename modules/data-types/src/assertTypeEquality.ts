import GLOError, { assertEquality, DebugInfoProvider } from '@glossa-glo/error';
import { GLODataType, printType } from '.';

function compareArrays(arr1: any[], arr2: any[]) {
  return arr1.length === arr2.length && arr1.every((v, i) => v === arr2[i]);
}

export function assertTypeEquality({
  node,
  left,
  right,
  allowPromoteLeft = true,
  allowPromoteRight = true,
  message, // Replaces LEFT_TYPE and RIGHT_TYPE with types
}: {
  node: DebugInfoProvider;
  left: typeof GLODataType;
  right: typeof GLODataType;
  allowPromoteLeft?: boolean;
  allowPromoteRight?: boolean;
  message?: string;
}) {
  const leftPrint = printType(left);
  const rightPrint = printType(right);

  let promoteLeft: typeof GLODataType | null = null;
  let promoteRight: typeof GLODataType | null = null;

  if (left !== right) {
    if (
      allowPromoteLeft &&
      left.promotable &&
      left.promotable.includes(right)
    ) {
      promoteLeft = left = right;
    } else if (
      allowPromoteRight &&
      right.promotable &&
      right.promotable.includes(left)
    ) {
      promoteRight = right = left;
    } else if (
      allowPromoteLeft &&
      allowPromoteRight &&
      left.promotable &&
      right.promotable
    ) {
      for (const sharedPromotableCandidate of left.promotable!) {
        if (right.promotable!.includes(sharedPromotableCandidate)) {
          promoteLeft = promoteRight = left = right = sharedPromotableCandidate;
        }
      }
    }
  }

  if (left.multitype && left.multitype.includes(right)) {
    left = right;
  } else if (right.multitype && right.multitype.includes(left)) {
    right = left;
  } else if (left.multitype && right.multitype) {
    for (const sharedMultitypeCandidate of left.multitype!) {
      if (right.multitype!.includes(sharedMultitypeCandidate)) {
        left = right = sharedMultitypeCandidate;
      }
    }
  }

  const errorMessage = message
    ? message
        .replace(/LEFT_TYPE/g, leftPrint)
        .replace(/RIGHT_TYPE/g, rightPrint)
    : `Περίμενα οι τελεστέοι να είναι του ίδιου τύπου, αλλά έλαβα μη συμβατούς τύπους ${leftPrint} και ${rightPrint}`;

  if (left.isArrayType && right.isArrayType) {
    if (
      (left as any).componentType === (right as any).componentType &&
      compareArrays(
        (left as any).dimensionLength,
        (right as any).dimensionLength,
      )
    ) {
      return {
        promoteLeft,
        promoteRight,
      };
    } else {
      throw new GLOError(node, errorMessage);
    }
  }

  assertEquality(node, left, right, errorMessage);

  return {
    promoteLeft,
    promoteRight,
  };
}

export function assertInstanceTypeEquality({
  node,
  left,
  right,
  allowPromoteLeft = true,
  allowPromoteRight = true,
  message, // Replaces LEFT_TYPE and RIGHT_TYPE with types
}: {
  node: DebugInfoProvider;
  left: GLODataType;
  right: GLODataType;
  allowPromoteLeft?: boolean;
  allowPromoteRight?: boolean;
  message?: string;
}) {
  return assertTypeEquality({
    node,
    left: left.constructor as typeof GLODataType,
    right: right.constructor as typeof GLODataType,
    allowPromoteLeft,
    allowPromoteRight,
    message, // Replaces LEFT_TYPE and RIGHT_TYPE with types
  });
}
