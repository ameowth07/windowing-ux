import type { LayoutNode } from '../../types/layout';
import { PanelContainer } from './PanelContainer';
import { SplitNode } from './SplitNode';

interface LayoutRendererProps {
  node: LayoutNode;
}

export function LayoutRenderer({ node }: LayoutRendererProps) {
  if (node.type === 'split') {
    return <SplitNode node={node} />;
  }

  return <PanelContainer node={node} />;
}
