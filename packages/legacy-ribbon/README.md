# @mdi/legacy-ribbon

Roblox Studio–style legacy ribbon: mezzanine (Test dropdown, playback, tabs) + toolbar (transform / insert / edit tools).

## Copy to another project

Copy the entire `packages/legacy-ribbon` folder into your repo, then:

```bash
npm install react react-dom lucide-react
```

Point your bundler at `src/index.ts` (or publish/install as a local package).

## Install in this monorepo

Already wired as a workspace package:

```tsx
import { LegacyRibbon, RibbonToolbar } from '@mdi/legacy-ribbon'
import '@mdi/legacy-ribbon/tokens.css'
```

## Usage

```tsx
import { LegacyRibbon } from '@mdi/legacy-ribbon'
import '@mdi/legacy-ribbon/tokens.css'

export function App() {
  return (
    <LegacyRibbon
      simulating={false}
      simViewportFocus="client"
      onSimViewportFocusToggle={() => {}}
      onPlay={({ testRunMode, clientSpawnCount }) => {
        console.log('Play', testRunMode, clientSpawnCount)
      }}
      onStop={() => console.log('Stop')}
    />
  )
}
```

**Toolbar only** (no mezzanine):

```tsx
import { RibbonToolbar } from '@mdi/legacy-ribbon'
import '@mdi/legacy-ribbon/tokens.css'

<RibbonToolbar />
```

## Exports

| Export | Description |
|--------|-------------|
| `LegacyRibbon` | Full ribbon (default export re-exported as named) |
| `RibbonToolbar` | Lower tool row only |
| `LegacyRibbonProps` | Props type |
| `TestRunMode` | `'test' \| 'serverAndClients'` |
| `SimViewportFocus` | `'client' \| 'server'` |
| `@mdi/legacy-ribbon/tokens.css` | Design tokens (`:root` CSS variables) |

## Props

```typescript
type LegacyRibbonProps = {
  simulating?: boolean
  simViewportFocus?: 'client' | 'server'
  onSimViewportFocusToggle?: () => void
  onPlay?: (config: {
    testRunMode: 'test' | 'serverAndClients'
    clientSpawnCount: number
  }) => void
  onStop?: () => void
  testPlaybackDisabled?: boolean
}
```

Ribbon tabs and toolbar tools use internal visual state only. Wire your own handlers by forking or extending the components if you need real tab/tool behavior.

## Requirements

- React 18 or 19
- CSS Modules support (Vite, Next.js, etc.)
- `lucide-react` (peer dependency)

## Files

```
packages/legacy-ribbon/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts           # barrel export
    ├── LegacyRibbon.tsx
    ├── RibbonToolbar.tsx
    ├── ribbon.module.css
    └── tokens.css         # optional but recommended
```
