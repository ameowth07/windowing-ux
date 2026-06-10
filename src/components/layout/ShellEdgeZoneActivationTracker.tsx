import { useDndMonitor } from '@dnd-kit/core';
import { useEffect, useRef } from 'react';
import {
  getAllShellEdgeZones,
  getEdgeDropZoneAtPoint,
  useEdgeDropZoneDelay,
} from '../../context/EdgeDropZoneDelayContext';
import { getPointerFromDragEvent } from '../floating/resolveFloatDropPreview';
import { isDockingDrag } from '../dnd/dragTypes';

export function ShellEdgeZoneActivationTracker() {
  const { enabled, delayMs, resetActivation, setActivatedZones } =
    useEdgeDropZoneDelay();
  const hoverZoneRef = useRef<ReturnType<typeof getEdgeDropZoneAtPoint>>(null);
  const hoverStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    hoverZoneRef.current = null;
    hoverStartedAtRef.current = null;
  }, [enabled, delayMs]);

  useDndMonitor({
    onDragStart(event) {
      hoverZoneRef.current = null;
      hoverStartedAtRef.current = null;

      if (!isDockingDrag(event.active.data.current)) {
        resetActivation();
        return;
      }

      if (!enabled) {
        setActivatedZones(new Set(getAllShellEdgeZones()));
        return;
      }

      resetActivation();
    },
    onDragMove(event) {
      if (!enabled || !isDockingDrag(event.active.data.current)) return;

      const pointer = getPointerFromDragEvent(event);
      const zone = getEdgeDropZoneAtPoint(pointer.x, pointer.y);

      if (zone !== hoverZoneRef.current) {
        hoverZoneRef.current = zone;
        hoverStartedAtRef.current = zone ? Date.now() : null;
        setActivatedZones(new Set());
        return;
      }

      if (!zone || hoverStartedAtRef.current === null) {
        return;
      }

      const elapsed = Date.now() - hoverStartedAtRef.current;
      if (elapsed >= delayMs) {
        setActivatedZones(new Set([zone]));
      }
    },
    onDragEnd() {
      hoverZoneRef.current = null;
      hoverStartedAtRef.current = null;
      resetActivation();
    },
    onDragCancel() {
      hoverZoneRef.current = null;
      hoverStartedAtRef.current = null;
      resetActivation();
    },
  });

  return null;
}
