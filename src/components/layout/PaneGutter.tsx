import './PaneGutter.css';

export const PANE_GUTTER_SIZE = 4;

interface PaneGutterProps {
  /** Vertical gutter sits between columns; horizontal gutter sits between rows. */
  orientation: 'horizontal' | 'vertical';
  onResizeStart?: (event: React.MouseEvent) => void;
  active?: boolean;
  className?: string;
  ariaValueNow?: number;
  ariaValueMin?: number;
  ariaValueMax?: number;
}

export function PaneGutter({
  orientation,
  onResizeStart,
  active = false,
  className,
  ariaValueNow,
  ariaValueMin,
  ariaValueMax,
}: PaneGutterProps) {
  const isResizable = Boolean(onResizeStart);

  return (
    <div
      className={[
        'pane-gutter',
        `pane-gutter--${orientation}`,
        active ? 'pane-gutter--active' : '',
        isResizable ? 'pane-gutter--resizable' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={isResizable ? 'separator' : undefined}
      aria-orientation={
        isResizable
          ? orientation === 'horizontal'
            ? 'horizontal'
            : 'vertical'
          : undefined
      }
      aria-valuenow={isResizable ? ariaValueNow : undefined}
      aria-valuemin={isResizable ? ariaValueMin : undefined}
      aria-valuemax={isResizable ? ariaValueMax : undefined}
      onMouseDown={onResizeStart}
    >
      <div className="pane-gutter__line" />
      <div className="pane-gutter__line" />
    </div>
  );
}
