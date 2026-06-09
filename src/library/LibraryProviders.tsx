import { DndContext, pointerWithin, rectIntersection } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { AppWindowProvider } from '../context/AppWindowContext';
import { DropZoneVariantProvider } from '../context/DropZoneVariantContext';
import { LayoutProvider } from '../context/LayoutContext';
import { ProjectTabBarProvider } from '../context/ProjectTabBarContext';
import { EnforceDocumentRegionProvider } from '../context/EnforceDocumentRegionContext';
import { SkeletonContentProvider } from '../context/SkeletonContentContext';
import { PrimaryWindowProvider } from '../context/PrimaryWindowContext';
import {
  INITIAL_WINDOW_ID,
  PrimaryWindowsProvider,
} from '../context/PrimaryWindowsContext';
import { MonitorLayoutProvider } from '../context/MonitorLayoutContext';
import { ScopeTabProvider } from '../context/ScopeTabContext';
import { ShowDropzonesProvider } from '../context/ShowDropzonesContext';
import type { LibraryProvider } from './types';

const collisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

interface LibraryProvidersProps {
  providers?: LibraryProvider[];
  children: ReactNode;
}

export function LibraryProviders({
  providers = [],
  children,
}: LibraryProvidersProps) {
  let content = children;

  if (providers.includes('appWindow')) {
    content = <AppWindowProvider>{content}</AppWindowProvider>;
  }

  if (providers.includes('scopeTab')) {
    content = (
      <MonitorLayoutProvider>
        <PrimaryWindowsProvider>
          <ScopeTabProvider>
            <PrimaryWindowProvider windowId={INITIAL_WINDOW_ID}>
              {content}
            </PrimaryWindowProvider>
          </ScopeTabProvider>
        </PrimaryWindowsProvider>
      </MonitorLayoutProvider>
    );
  }

  if (providers.includes('projectTabBar')) {
    content = <ProjectTabBarProvider>{content}</ProjectTabBarProvider>;
  }

  if (providers.includes('skeletonContent')) {
    content = <SkeletonContentProvider>{content}</SkeletonContentProvider>;
  }

  if (providers.includes('enforceDocumentRegion')) {
    content = (
      <EnforceDocumentRegionProvider>{content}</EnforceDocumentRegionProvider>
    );
  }

  if (providers.includes('layout')) {
    content = (
      <LayoutProvider windowId={INITIAL_WINDOW_ID}>{content}</LayoutProvider>
    );
  }

  if (providers.includes('dnd')) {
    content = (
      <ShowDropzonesProvider>
        <DropZoneVariantProvider>
          <DndContext collisionDetection={collisionDetection}>{content}</DndContext>
        </DropZoneVariantProvider>
      </ShowDropzonesProvider>
    );
  }

  return content;
}
