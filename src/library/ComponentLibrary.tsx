import { useCallback, useMemo, useState } from 'react';
import { DropZoneVariantToggle } from '../components/layout/DropZoneVariantToggle';
import { DropZoneVariantProvider } from '../context/DropZoneVariantContext';
import { PreviewCanvas } from './PreviewCanvas';
import { PropsPanel } from './PropsPanel';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_STORIES,
  getDefaultProps,
  getStoryById,
} from './registry';
import type { CanvasBackground } from './types';
import './ComponentLibrary.css';

const BACKGROUND_OPTIONS: { value: CanvasBackground; label: string }[] = [
  { value: 'surface', label: 'Surface' },
  { value: 'checker', label: 'Checker' },
  { value: 'transparent', label: 'Transparent' },
];

export function ComponentLibrary() {
  const [selectedId, setSelectedId] = useState(COMPONENT_STORIES[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [background, setBackground] = useState<CanvasBackground>('surface');
  const [propsByStory, setPropsByStory] = useState<
    Record<string, Record<string, unknown>>
  >(() => {
    const initial: Record<string, Record<string, unknown>> = {};
    for (const story of COMPONENT_STORIES) {
      initial[story.id] = getDefaultProps(story);
    }
    return initial;
  });

  const selectedStory = getStoryById(selectedId) ?? COMPONENT_STORIES[0];
  const currentProps = propsByStory[selectedStory.id] ?? getDefaultProps(selectedStory);

  const filteredStories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COMPONENT_STORIES;
    return COMPONENT_STORIES.filter(
      (story) =>
        story.name.toLowerCase().includes(query) ||
        story.category.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query),
    );
  }, [search]);

  const groupedStories = useMemo(() => {
    const groups = new Map<string, typeof COMPONENT_STORIES>();
    for (const category of COMPONENT_CATEGORIES) {
      groups.set(category, []);
    }
    for (const story of filteredStories) {
      groups.get(story.category)?.push(story);
    }
    return groups;
  }, [filteredStories]);

  const handlePropChange = useCallback(
    (key: string, value: unknown) => {
      setPropsByStory((prev) => ({
        ...prev,
        [selectedStory.id]: {
          ...prev[selectedStory.id],
          [key]: value,
        },
      }));
    },
    [selectedStory.id],
  );

  const handleApplyVariant = useCallback(
    (variantProps: Record<string, unknown>) => {
      setPropsByStory((prev) => ({
        ...prev,
        [selectedStory.id]: {
          ...getDefaultProps(selectedStory),
          ...variantProps,
        },
      }));
    },
    [selectedStory],
  );

  const handleReset = useCallback(() => {
    setPropsByStory((prev) => ({
      ...prev,
      [selectedStory.id]: getDefaultProps(selectedStory),
    }));
  }, [selectedStory]);

  return (
    <DropZoneVariantProvider>
      <div className="component-library">
      <header className="component-library__header">
        <div className="component-library__brand">
          <span className="component-library__logo">◫</span>
          <div>
            <h1 className="component-library__title">Component Library</h1>
            <p className="component-library__subtitle">
              Edit props and preview components in isolation
            </p>
          </div>
        </div>
        <div className="component-library__header-actions">
          <label className="component-library__zone-picker">
            <span>Drop zones</span>
            <DropZoneVariantToggle />
          </label>
          <label className="component-library__background-picker">
            <span>Background</span>
            <select
              value={background}
              onChange={(event) =>
                setBackground(event.target.value as CanvasBackground)
              }
            >
              {BACKGROUND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <a className="component-library__app-link" href="#/">
            Open app
          </a>
        </div>
      </header>

      <div className="component-library__body">
        <nav className="component-library__sidebar">
          <input
            type="search"
            className="component-library__search"
            placeholder="Search components…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {COMPONENT_CATEGORIES.map((category) => {
            const stories = groupedStories.get(category) ?? [];
            if (stories.length === 0) return null;

            return (
              <section key={category} className="component-library__nav-group">
                <h2 className="component-library__nav-heading">{category}</h2>
                <ul className="component-library__nav-list">
                  {stories.map((story) => (
                    <li key={story.id}>
                      <button
                        type="button"
                        className={`component-library__nav-item ${
                          story.id === selectedStory.id
                            ? 'component-library__nav-item--active'
                            : ''
                        }`}
                        onClick={() => setSelectedId(story.id)}
                      >
                        {story.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </nav>

        <main className="component-library__main">
          <div className="component-library__meta">
            <div>
              <h2 className="component-library__component-name">
                {selectedStory.name}
              </h2>
              <p className="component-library__description">
                {selectedStory.description}
              </p>
            </div>
            <code className="component-library__file-path">
              {selectedStory.filePath}
            </code>
          </div>

          <PreviewCanvas
            providers={selectedStory.providers}
            background={background}
            minHeight={selectedStory.previewMinHeight}
            showDragHint={selectedStory.showDragHint}
            componentName={selectedStory.name}
          >
            {selectedStory.render(currentProps)}
          </PreviewCanvas>

          <PropsPanel
            controls={selectedStory.controls}
            props={currentProps}
            variants={selectedStory.variants}
            onChange={handlePropChange}
            onApplyVariant={handleApplyVariant}
            onReset={handleReset}
          />
        </main>
      </div>
    </div>
    </DropZoneVariantProvider>
  );
}
