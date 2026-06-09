import type { LayoutState } from '../types/layout';

export function cloneLayoutState(state: LayoutState): LayoutState {
  return JSON.parse(JSON.stringify(state)) as LayoutState;
}
