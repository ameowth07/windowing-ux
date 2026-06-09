import type { RefObject } from 'react';
import { useLayout } from '../context/LayoutContext';
import { EmptyWorkspaceDrop } from './layout/EmptyWorkspaceDrop';
import { LayoutRenderer } from './layout/LayoutRenderer';
import './Workspace.css';

interface WorkspaceProps {
  workspaceRef: RefObject<HTMLDivElement | null>;
}

export function Workspace({ workspaceRef }: WorkspaceProps) {
  const { state } = useLayout();

  return (
    <div ref={workspaceRef} className="workspace">
      {state.root ? (
        <LayoutRenderer node={state.root} />
      ) : (
        <>
          <div className="workspace__empty">
            All panels are floating. Drag a tab back here to dock.
          </div>
          <EmptyWorkspaceDrop />
        </>
      )}
    </div>
  );
}
