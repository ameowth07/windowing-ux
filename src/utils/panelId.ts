import type { PanelId } from '../types/layout';

const DOCUMENT_INSTANCE_SEPARATOR = '#';

export function getBasePanelId(panelId: PanelId): PanelId {
  const separatorIndex = panelId.indexOf(DOCUMENT_INSTANCE_SEPARATOR);
  if (separatorIndex === -1) {
    return panelId;
  }
  return panelId.slice(0, separatorIndex);
}

export function createDocumentPanelInstanceId(
  baseId: PanelId,
  existingPanelIds: Iterable<PanelId>,
): PanelId {
  const instances: PanelId[] = [];
  for (const id of existingPanelIds) {
    if (getBasePanelId(id) === baseId) {
      instances.push(id);
    }
  }

  if (instances.length === 0) {
    return baseId;
  }

  let maxInstance = 1;
  for (const id of instances) {
    if (id === baseId) {
      maxInstance = Math.max(maxInstance, 1);
      continue;
    }

    const suffix = id.slice(baseId.length + DOCUMENT_INSTANCE_SEPARATOR.length);
    const parsed = Number.parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) {
      maxInstance = Math.max(maxInstance, parsed);
    }
  }

  return `${baseId}${DOCUMENT_INSTANCE_SEPARATOR}${maxInstance + 1}`;
}
