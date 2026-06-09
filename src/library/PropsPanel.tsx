import { useMemo } from 'react';
import type { PropControl } from './types';
import './PropsPanel.css';

interface PropsPanelProps {
  controls: PropControl[];
  props: Record<string, unknown>;
  variants?: { name: string; props: Record<string, unknown> }[];
  onChange: (key: string, value: unknown) => void;
  onApplyVariant: (props: Record<string, unknown>) => void;
  onReset: () => void;
}

export function PropsPanel({
  controls,
  props,
  variants,
  onChange,
  onApplyVariant,
  onReset,
}: PropsPanelProps) {
  const propsJson = useMemo(
    () => JSON.stringify(props, null, 2),
    [props],
  );

  return (
    <aside className="props-panel">
      <div className="props-panel__header">
        <h2 className="props-panel__title">Props</h2>
        <button type="button" className="props-panel__reset" onClick={onReset}>
          Reset
        </button>
      </div>

      {variants && variants.length > 0 ? (
        <section className="props-panel__section">
          <h3 className="props-panel__section-title">Variants</h3>
          <div className="props-panel__variants">
            {variants.map((variant) => (
              <button
                key={variant.name}
                type="button"
                className="props-panel__variant-btn"
                onClick={() => onApplyVariant(variant.props)}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="props-panel__section">
        <h3 className="props-panel__section-title">Controls</h3>
        {controls.length === 0 ? (
          <p className="props-panel__empty">No configurable props.</p>
        ) : (
          <div className="props-panel__controls">
            {controls.map((control) => (
              <PropControlField
                key={control.key}
                control={control}
                value={props[control.key]}
                onChange={onChange}
              />
            ))}
          </div>
        )}
      </section>

      <section className="props-panel__section">
        <h3 className="props-panel__section-title">JSON</h3>
        <pre className="props-panel__json">{propsJson}</pre>
      </section>
    </aside>
  );
}

function PropControlField({
  control,
  value,
  onChange,
}: {
  control: PropControl;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}) {
  const id = `prop-${control.key}`;

  return (
    <label className="props-panel__field" htmlFor={id}>
      <span className="props-panel__label">{control.label}</span>
      {control.type === 'boolean' ? (
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(control.key, event.target.checked)}
        />
      ) : null}
      {control.type === 'string' ? (
        <input
          id={id}
          type="text"
          value={String(value ?? '')}
          onChange={(event) => onChange(control.key, event.target.value)}
        />
      ) : null}
      {control.type === 'number' ? (
        <input
          id={id}
          type="number"
          value={Number(value ?? control.defaultValue)}
          min={control.min}
          max={control.max}
          step={control.step}
          onChange={(event) => onChange(control.key, Number(event.target.value))}
        />
      ) : null}
      {control.type === 'select' ? (
        <select
          id={id}
          value={String(value ?? control.defaultValue)}
          onChange={(event) => onChange(control.key, event.target.value)}
        >
          {control.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
    </label>
  );
}
