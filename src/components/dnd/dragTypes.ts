import type { DragData, DragFloatingWindowData, DragPanelData, DragTabGroupData } from '../../types/layout';

export function isPanelDrag(data: unknown): data is DragPanelData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as DragPanelData).type === 'panel'
  );
}

export function isFloatingWindowDrag(data: unknown): data is DragFloatingWindowData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as DragFloatingWindowData).type === 'floating-window'
  );
}

export function isTabGroupDrag(data: unknown): data is DragTabGroupData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as DragTabGroupData).type === 'tab-group'
  );
}

export function isFloatingTabGroupDrag(data: unknown): data is DragTabGroupData {
  return isTabGroupDrag(data) && data.source === 'floating';
}

export function isDockingDrag(data: unknown): data is DragData {
  return isPanelDrag(data) || isTabGroupDrag(data);
}
