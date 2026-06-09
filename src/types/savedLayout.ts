import type { LayoutState } from './layout';

export interface SavedLayout {
  id: string;
  name: string;
  state: LayoutState;
  savedAt: number;
}
