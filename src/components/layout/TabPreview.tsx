import { getPanelDefinition } from '../../data/panels';
import type { PanelId } from '../../types/layout';
import { TabPanelIcon } from './TabPanelIcon';
import './DraggableTab.css';

interface TabPreviewProps {
  panelId: PanelId;
  active?: boolean;
}

export function TabPreview({ panelId, active = true }: TabPreviewProps) {
  const def = getPanelDefinition(panelId);

  return (
    <div className={`draggable-tab ${active ? 'draggable-tab--active' : ''}`}>
      {def?.icon ? <TabPanelIcon icon={def.icon} /> : null}
      <span>{def?.title ?? panelId}</span>
    </div>
  );
}
