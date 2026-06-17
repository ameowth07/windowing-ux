import { useCallback, useRef, useState } from 'react';
import { useLayout } from '../../context/LayoutContext';
import type { LayoutNode } from '../../types/layout';
import { LayoutRenderer } from './LayoutRenderer';
import { PANE_GUTTER_SIZE, PaneGutter } from './PaneGutter';
import './SplitNode.css';

const MIN_RATIO = 0.12;
const MAX_RATIO = 0.88;

interface SplitNodeProps {
  node: Extract<LayoutNode, { type: 'split' }>;
}

export function SplitNode({ node }: SplitNodeProps) {
  const { resizeSplitLocalized } = useLayout();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isHorizontal = node.direction === 'horizontal';

  const handleResizeStart = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const startPos = isHorizontal ? event.clientX : event.clientY;
      const axisSize =
        (isHorizontal ? rect.width : rect.height) - PANE_GUTTER_SIZE;

      setIsDragging(true);

      let lastPos = startPos;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - lastPos;
        lastPos = currentPos;
        if (delta === 0) return;
        resizeSplitLocalized(node.id, delta, axisSize);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [isHorizontal, node.id, resizeSplitLocalized],
  );

  return (
    <div
      ref={containerRef}
      className={`split-node ${isHorizontal ? 'split-node--horizontal' : 'split-node--vertical'} ${isDragging ? 'split-node--dragging' : ''}`}
    >
      <div className="split-node__pane" style={{ flex: node.ratio }}>
        <LayoutRenderer node={node.first} />
      </div>
      <PaneGutter
        orientation={isHorizontal ? 'vertical' : 'horizontal'}
        onResizeStart={handleResizeStart}
        active={isDragging}
        ariaValueNow={Math.round(node.ratio * 100)}
        ariaValueMin={MIN_RATIO * 100}
        ariaValueMax={MAX_RATIO * 100}
        gutterDrop={{
          splitId: node.id,
          secondNodeId: node.second.id,
          orientation: isHorizontal ? 'vertical' : 'horizontal',
        }}
      />
      <div className="split-node__pane" style={{ flex: 1 - node.ratio }}>
        <LayoutRenderer node={node.second} />
      </div>
    </div>
  );
}
