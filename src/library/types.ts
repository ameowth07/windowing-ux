import type { ReactNode } from 'react';

export type PropControl =
  | {
      type: 'boolean';
      key: string;
      label: string;
      defaultValue: boolean;
    }
  | {
      type: 'string';
      key: string;
      label: string;
      defaultValue: string;
    }
  | {
      type: 'number';
      key: string;
      label: string;
      defaultValue: number;
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      type: 'select';
      key: string;
      label: string;
      defaultValue: string;
      options: { value: string; label: string }[];
    };

export type LibraryProvider =
  | 'layout'
  | 'dnd'
  | 'appWindow'
  | 'scopeTab'
  | 'projectTabBar'
  | 'skeletonContent'
  | 'enforceDocumentRegion';

export interface ComponentVariant {
  name: string;
  props: Record<string, unknown>;
}

export interface ComponentStory {
  id: string;
  name: string;
  category: string;
  description: string;
  filePath: string;
  controls: PropControl[];
  defaultProps: Record<string, unknown>;
  variants?: ComponentVariant[];
  providers?: LibraryProvider[];
  showDragHint?: boolean;
  previewMinHeight?: number;
  render: (props: Record<string, unknown>) => ReactNode;
}

export type CanvasBackground = 'surface' | 'checker' | 'transparent';
