import { DROP_ZONE_VARIANTS, type DropZoneVariant } from '../../config/dropZones';
import { useDropZoneVariant } from '../../context/DropZoneVariantContext';
import './DropZoneVariantToggle.css';

export function DropZoneVariantToggle() {
  const { variant, setVariant } = useDropZoneVariant();

  return (
    <div className="zone-variant-toggle" role="group" aria-label="Drop zone layout">
      {(Object.keys(DROP_ZONE_VARIANTS) as DropZoneVariant[]).map((key) => (
        <button
          key={key}
          type="button"
          className={`zone-variant-toggle__btn ${variant === key ? 'zone-variant-toggle__btn--active' : ''}`}
          onClick={() => setVariant(key)}
          title={DROP_ZONE_VARIANTS[key].description}
        >
          {DROP_ZONE_VARIANTS[key].label}
        </button>
      ))}
    </div>
  );
}
