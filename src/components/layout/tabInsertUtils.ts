import type { FloatingBodyHoverData, TabInsertTargetData } from '../../types/layout';

export interface TabInsertSlotProps {
  nodeId: string;
  index: number;
  hidden?: boolean;
}

export function getTabInsertDropId(nodeId: string, index: number): string {
  return `tab-insert-${nodeId}-${index}`;
}

export function isTabInsertTarget(
  data: unknown,
): data is TabInsertTargetData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as TabInsertTargetData).type === 'tab-insert'
  );
}

export function isFloatingBodyHover(
  data: unknown,
): data is FloatingBodyHoverData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as FloatingBodyHoverData).type === 'floating-body-hover'
  );
}
