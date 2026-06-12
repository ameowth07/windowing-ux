import { useState, type ReactNode } from 'react'
import {
  Anchor,
  Box,
  Boxes,
  ChevronDown,
  FileCode2,
  FolderTree,
  Group,
  Layers2,
  Lock,
  Maximize2,
  Monitor,
  MousePointer2,
  Move,
  Mountain,
  PackagePlus,
  Paintbrush,
  Palette,
  RotateCw,
  Shapes,
  SlidersHorizontal,
  UserCircle2,
  Wrench,
} from 'lucide-react'
import css from './ribbon.module.css'

const ic = { size: 15 as const, strokeWidth: 1.5 as const }

const DEFAULT_ACTIVE_RIBBON_TOOL = 'select' as const

function G24({ children }: { children: ReactNode }) {
  return (
    <div className={css.b24}>
      <div className={css.glyphCenter}>{children}</div>
    </div>
  )
}

function ChevSm() {
  return (
    <svg
      className={css.chevSvg}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <path
        d="M2 3L5 6.2L8 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VDiv() {
  return <div className={css.vDivider} aria-hidden />
}

function ToggleTool({
  toolId,
  label,
  active,
  onPress,
  children,
}: {
  toolId: string
  label: string
  active: boolean
  onPress: (toolId: string) => void
  children: ReactNode
}) {
  return (
    <div className={`${css.toggleCol} ${active ? css.toggleColActive : ''}`}>
      <button
        type="button"
        className={`${css.toggleBtn} ${active ? css.ribbonToolActive : ''}`}
        aria-pressed={active}
        onClick={() => onPress(toolId)}
      >
        {children}
      </button>
      <div className={css.toggleLabel}>
        <span>{label}</span>
      </div>
    </div>
  )
}

function SplitTool({
  toolId,
  label,
  active,
  onPress,
  main,
}: {
  toolId: string
  label: string
  active: boolean
  onPress: (toolId: string) => void
  main: ReactNode
}) {
  return (
    <div className={css.splitTool}>
      <div className={css.splitTop}>
        <button
          type="button"
          className={`${css.splitMain} ${active ? css.ribbonToolActive : ''}`}
          aria-pressed={active}
          onClick={() => onPress(toolId)}
        >
          {main}
        </button>
        <button type="button" className={css.splitDrop} aria-label={`${label} options`}>
          <ChevSm />
        </button>
      </div>
      <div className={css.toggleLabel}>
        <span>{label}</span>
      </div>
    </div>
  )
}

function SpinPair() {
  return (
    <div className={css.spinCol}>
      <div className={css.spinRow}>
        <span className={css.checkFake} aria-hidden>
          <svg width={11} height={11} viewBox="0 0 11 11" aria-hidden>
            <path
              d="M2 5.5 L4.2 8 L9 2.5"
              stroke="#202227"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className={css.spinBox}>
          <div className={css.spinBoxIcon}>
            <Move size={14} strokeWidth={1.5} aria-hidden />
          </div>
          <span className={css.spinBoxInput}>1 stud</span>
          <button type="button" className={css.spinBoxCtrl} aria-hidden tabIndex={-1}>
            <ChevronDown size={12} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
      <div className={css.spinRow}>
        <span className={css.checkFake} aria-hidden>
          <svg width={11} height={11} viewBox="0 0 11 11" aria-hidden>
            <path
              d="M2 5.5 L4.2 8 L9 2.5"
              stroke="#202227"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className={css.spinBox}>
          <div className={css.spinBoxIcon}>
            <RotateCw size={14} strokeWidth={1.5} aria-hidden />
          </div>
          <span className={css.spinBoxInput}>45°</span>
          <button type="button" className={css.spinBoxCtrl} aria-hidden tabIndex={-1}>
            <ChevronDown size={12} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Lower ribbon row (Figma node 3841:115043). Icons use Lucide vectors (Figma MCP raster URLs expire). */
export function RibbonToolbar() {
  const [activeTool, setActiveTool] = useState<string>(DEFAULT_ACTIVE_RIBBON_TOOL)
  const isActive = (toolId: string) => activeTool === toolId
  const pressTool = (toolId: string) => {
    setActiveTool((current) => (current === toolId ? '' : toolId))
  }

  return (
    <div className={css.toolbar} data-node-id="3841:115043">
      <div className={css.toolGroup} data-node-id="3841:115045">
        <ToggleTool toolId="select" label="Select" active={isActive('select')} onPress={pressTool}>
          <G24>
            <MousePointer2 {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="move" label="Move" active={isActive('move')} onPress={pressTool}>
          <G24>
            <Move {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="scale" label="Scale" active={isActive('scale')} onPress={pressTool}>
          <G24>
            <Maximize2 {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="rotate" label="Rotate" active={isActive('rotate')} onPress={pressTool}>
          <G24>
            <RotateCw {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="transform" label="Transform" active={isActive('transform')} onPress={pressTool}>
          <G24>
            <Layers2 {...ic} aria-hidden />
          </G24>
        </ToggleTool>
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="3841:115052">
        <SplitTool
          toolId="geometric"
          label="Geometric"
          active={isActive('geometric')}
          onPress={pressTool}
          main={
            <G24>
              <Shapes {...ic} aria-hidden />
            </G24>
          }
        />
        <SpinPair />
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="3841:115115">
        <SplitTool
          toolId="part"
          label="Part"
          active={isActive('part')}
          onPress={pressTool}
          main={
            <G24>
              <Box {...ic} aria-hidden />
            </G24>
          }
        />
        <ToggleTool toolId="terrain" label="Terrain" active={isActive('terrain')} onPress={pressTool}>
          <G24>
            <Mountain {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <SplitTool
          toolId="character"
          label="Character"
          active={isActive('character')}
          onPress={pressTool}
          main={
            <G24>
              <UserCircle2 {...ic} aria-hidden />
            </G24>
          }
        />
        <SplitTool
          toolId="gui"
          label="GUI"
          active={isActive('gui')}
          onPress={pressTool}
          main={
            <G24>
              <Monitor {...ic} aria-hidden />
            </G24>
          }
        />
        <SplitTool
          toolId="script"
          label="Script"
          active={isActive('script')}
          onPress={pressTool}
          main={
            <G24>
              <FileCode2 {...ic} aria-hidden />
            </G24>
          }
        />
        <ToggleTool toolId="import-3d" label="Import 3D" active={isActive('import-3d')} onPress={pressTool}>
          <G24>
            <PackagePlus {...ic} aria-hidden />
          </G24>
        </ToggleTool>
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="3841:115123">
        <SplitTool
          toolId="material"
          label="Material"
          active={isActive('material')}
          onPress={pressTool}
          main={
            <G24>
              <Paintbrush {...ic} aria-hidden />
            </G24>
          }
        />
        <SplitTool
          toolId="color"
          label="Color"
          active={isActive('color')}
          onPress={pressTool}
          main={
            <G24>
              <Palette {...ic} aria-hidden />
            </G24>
          }
        />
        <ToggleTool toolId="group" label="Group" active={isActive('group')} onPress={pressTool}>
          <G24>
            <Group {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <SplitTool
          toolId="lock"
          label="Lock"
          active={isActive('lock')}
          onPress={pressTool}
          main={
            <G24>
              <Lock {...ic} aria-hidden />
            </G24>
          }
        />
        <SplitTool
          toolId="anchor"
          label="Anchor"
          active={isActive('anchor')}
          onPress={pressTool}
          main={
            <G24>
              <Anchor {...ic} aria-hidden />
            </G24>
          }
        />
      </div>

      <VDiv />

      <div className={css.toolGroup} data-node-id="3841:115131">
        <ToggleTool toolId="toolbox" label="Toolbox" active={isActive('toolbox')} onPress={pressTool}>
          <G24>
            <Wrench {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="explorer" label="Explorer" active={isActive('explorer')} onPress={pressTool}>
          <G24>
            <FolderTree {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="properties" label="Properties" active={isActive('properties')} onPress={pressTool}>
          <G24>
            <SlidersHorizontal {...ic} aria-hidden />
          </G24>
        </ToggleTool>
        <ToggleTool toolId="assets" label="Assets" active={isActive('assets')} onPress={pressTool}>
          <G24>
            <Boxes {...ic} aria-hidden />
          </G24>
        </ToggleTool>
      </div>
    </div>
  )
}
