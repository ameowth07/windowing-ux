import type { PanelIcon } from '../../types/layout';

interface TabPanelIconProps {
  icon: PanelIcon;
}

export function TabPanelIcon({ icon }: TabPanelIconProps) {
  switch (icon) {
    case 'globe':
      return <GlobeIcon />;
    case 'script':
      return <ScriptIcon />;
    case 'avatar':
      return <AvatarIcon />;
    case 'document':
      return <DocumentIcon />;
  }
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
      <circle cx="7" cy="7" r="5.5" />
      <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
      <path d="M1.5 7h11M2.5 4.5h9M2.5 9.5h9" />
    </svg>
  );
}

function ScriptIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="2.5" y="2.5" width="9" height="9" rx="1" />
      <path d="M4.5 5h5M4.5 7h5M4.5 9h3" strokeLinecap="round" />
    </svg>
  );
}

function AvatarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
      <circle cx="7" cy="5" r="2.25" />
      <path d="M3 11.5c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeLinecap="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M3.5 2.5h5.5L10.5 4.5v7H3.5V2.5z" />
      <path d="M8.5 2.5V4.5H10.5" />
    </svg>
  );
}
