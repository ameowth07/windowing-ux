export function getMonitorWindowsElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '.desktop__monitor-windows, .gallery-desktop__windows',
    ),
  );
}

function getMonitorIndexFromElement(element: HTMLElement): number {
  if (element.dataset.monitorIndex != null) {
    return Number(element.dataset.monitorIndex);
  }

  const surface = element.closest<HTMLElement>('.gallery-desktop__surface');
  if (surface?.dataset.desktopIndex != null) {
    return Number(surface.dataset.desktopIndex);
  }

  return 0;
}

export function getWindowContainerElement(
  monitorIndex: number,
  monitorCount: number,
): HTMLElement | null {
  if (monitorCount === 1) {
    return (
      document.querySelector<HTMLElement>('.desktop__monitor-windows') ??
      document.querySelector<HTMLElement>('.desktop__windows')
    );
  }

  return (
    document.querySelector<HTMLElement>(
      `[data-monitor-index="${monitorIndex}"]`,
    ) ?? null
  );
}

export function getWindowContainerSize(
  monitorIndex: number,
  monitorCount: number,
): { width: number; height: number } {
  const element = getWindowContainerElement(monitorIndex, monitorCount);
  if (element) {
    return { width: element.clientWidth, height: element.clientHeight };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

export function getMonitorIndexAtPoint(
  clientX: number,
  clientY: number,
): number {
  const containers = getMonitorWindowsElements();
  if (containers.length === 0) return 0;
  if (containers.length === 1) return getMonitorIndexFromElement(containers[0]);

  for (const container of containers) {
    const rect = container.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return getMonitorIndexFromElement(container);
    }
  }

  return getClosestMonitorIndex(clientX, clientY, containers);
}

function getClosestMonitorIndex(
  clientX: number,
  clientY: number,
  containers: HTMLElement[],
): number {
  let closestIndex = getMonitorIndexFromElement(containers[0]);
  let closestDistance = Infinity;

  for (const container of containers) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = getMonitorIndexFromElement(container);
    }
  }

  return closestIndex;
}

export function getWindowContainerAtPoint(
  clientX: number,
  clientY: number,
  monitorCount: number,
): HTMLElement | null {
  const monitorIndex = getMonitorIndexAtPoint(clientX, clientY);
  return getWindowContainerElement(monitorIndex, monitorCount);
}
