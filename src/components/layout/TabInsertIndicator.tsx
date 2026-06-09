import './TabInsertIndicator.css';

interface TabInsertIndicatorProps {
  active?: boolean;
}

export function TabInsertIndicator({ active = false }: TabInsertIndicatorProps) {
  return (
    <div
      className={`tab-insert-indicator ${active ? 'tab-insert-indicator--active' : ''}`}
      aria-hidden="true"
    />
  );
}
