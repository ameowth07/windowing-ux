import { useEffect, useId, useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CircleUser,
  LogOut,
  Monitor,
  Play,
  Plus,
  Server,
  Share2,
  Sparkles,
  Square,
  Users,
} from 'lucide-react'
import css from './ribbon.module.css'
import { RibbonToolbar } from './RibbonToolbar'

export type TestRunMode = 'test' | 'serverAndClients'
export type SimViewportFocus = 'client' | 'server'

const TEST_RUN_OPTIONS: { id: TestRunMode; label: string }[] = [
  { id: 'test', label: 'Test' },
  { id: 'serverAndClients', label: 'Server & Clients' },
]

const MIN_CLIENT_SPAWN_COUNT = 1
const MAX_CLIENT_SPAWN_COUNT = 99

const RIBBON_TABS = ['Home', 'Model', 'Avatar', 'UI', 'Script'] as const

function clampClientSpawnCount(value: number): number {
  if (!Number.isFinite(value)) return MIN_CLIENT_SPAWN_COUNT
  return Math.min(MAX_CLIENT_SPAWN_COUNT, Math.max(MIN_CLIENT_SPAWN_COUNT, Math.round(value)))
}

type ClientSpawnSpinboxProps = {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

function ClientSpawnSpinbox({ value, onChange, disabled }: ClientSpawnSpinboxProps) {
  const bump = (delta: number) => {
    onChange(clampClientSpawnCount(value + delta))
  }

  return (
    <div
      className={`${css.clientSpawnSpinbox} ${disabled ? css.clientSpawnSpinboxDisabled : ''}`}
      data-node-id="3841:115016-client-spawn"
    >
      <div className={css.clientSpawnSpinboxIcon} aria-hidden>
        <Users size={14} strokeWidth={1.5} aria-hidden />
      </div>
      <input
        type="number"
        className={css.clientSpawnSpinboxInput}
        min={MIN_CLIENT_SPAWN_COUNT}
        max={MAX_CLIENT_SPAWN_COUNT}
        step={1}
        value={value}
        disabled={disabled}
        aria-label="Clients to spawn"
        onChange={(e) => onChange(clampClientSpawnCount(Number(e.target.value)))}
      />
      <div className={css.clientSpawnSpinboxSteppers}>
        <button
          type="button"
          className={css.clientSpawnSpinboxStep}
          aria-label="Increase clients"
          disabled={disabled || value >= MAX_CLIENT_SPAWN_COUNT}
          onClick={() => bump(1)}
        >
          <ChevronUp size={12} strokeWidth={1.5} aria-hidden />
        </button>
        <button
          type="button"
          className={css.clientSpawnSpinboxStep}
          aria-label="Decrease clients"
          disabled={disabled || value <= MIN_CLIENT_SPAWN_COUNT}
          onClick={() => bump(-1)}
        >
          <ChevronDown size={12} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    </div>
  )
}

function PauseIcon() {
  return (
    <svg
      className={css.pauseSvg}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      aria-hidden
    >
      <rect x="4.25" y="3.5" width="2.75" height="9" rx="0.35" />
      <rect x="9" y="3.5" width="2.75" height="9" rx="0.35" />
    </svg>
  )
}

function ChevSmSplit() {
  return (
    <svg
      className={css.pauseChevron}
      width={10}
      height={10}
      viewBox="0 0 10 10"
      aria-hidden
    >
      <path
        d="M2 3L5 6.2L8 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Same stroke chevron as toolbar split drops (RibbonToolbar ChevSm) — avoids Unicode ▾ emoji substitution. */
function TestDropdownChevron() {
  return (
    <svg
      className={css.testDropdownChevIcon}
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

/** Mezzanine cloud — vector (MCP raster 404); matches common “cloud” glyph, not user-in-frame. */
function CloudIcon() {
  return (
    <svg
      className={css.cloudIcon}
      width={16}
      height={16}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12.5A4.5 4.5 0 005.5 17H15a4 4 0 001.866-7.539 3.504 3.504 0 00-4.504-4.272A4.5 4.5 0 001 12.5z"
      />
    </svg>
  )
}

export type LegacyRibbonProps = {
  /** Simulation running — mezzanine playback matches active run (Figma 3841:113027). */
  simulating?: boolean
  /** Test mode: which Client / Server view is focused — reflected on the view toggle. */
  simViewportFocus?: SimViewportFocus
  /** Test mode: switch Client ↔ Server focus. */
  onSimViewportFocusToggle?: () => void
  onPlay?: (config: { testRunMode: TestRunMode; clientSpawnCount: number }) => void
  onStop?: () => void
  /** Asset-only frame (e.g. Bunny) — Test menu and playback controls are inert. */
  testPlaybackDisabled?: boolean
}

/** Assistant / Copilot — Lucide glyph; custom scaled paths were sub-pixel at 16×16. */
function AssistantIcon() {
  return <Sparkles className={css.assistantIcon} size={16} strokeWidth={1.5} aria-hidden />
}

/** Figma node 3841:115005 — [Legacy] Ribbon */
export default function LegacyRibbon({
  simulating,
  simViewportFocus = 'client',
  onSimViewportFocusToggle,
  onPlay,
  onStop,
  testPlaybackDisabled,
}: LegacyRibbonProps) {
  const testMenuId = useId()
  const testDropdownRef = useRef<HTMLDivElement>(null)
  const [testRunMode, setTestRunMode] = useState<TestRunMode>('test')
  const [testMenuOpen, setTestMenuOpen] = useState(false)
  const [clientSpawnCount, setClientSpawnCount] = useState(MIN_CLIENT_SPAWN_COUNT)
  const [sessionPaused, setSessionPaused] = useState(false)

  const serverClientsMode = testRunMode === 'serverAndClients'
  const playbackLocked = !!testPlaybackDisabled
  const testDropdownDisabled = !!simulating || playbackLocked
  const viewToggleDisabled = !simulating || playbackLocked
  const viewToggleLabel =
    simViewportFocus === 'client' ? 'Switch to Server' : 'Switch to Client'
  const testRunLabel =
    TEST_RUN_OPTIONS.find((o) => o.id === testRunMode)?.label ?? 'Test'

  useEffect(() => {
    if (!testMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (!testDropdownRef.current?.contains(e.target as Node)) setTestMenuOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTestMenuOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [testMenuOpen])

  useEffect(() => {
    if (testDropdownDisabled) setTestMenuOpen(false)
  }, [testDropdownDisabled])

  useEffect(() => {
    setSessionPaused(false)
  }, [testRunMode])

  useEffect(() => {
    if (!simulating) setSessionPaused(false)
  }, [simulating])

  const handlePlay = () => {
    if (simulating) {
      setSessionPaused(false)
      return
    }
    setSessionPaused(false)
    onPlay?.({ testRunMode, clientSpawnCount })
  }

  const handleExit = () => {
    setSessionPaused(false)
    onStop?.()
  }

  return (
    <div
      className={`${css.ribbonRoot} ${testMenuOpen ? css.ribbonRootDropdownOpen : ''}`}
      data-node-id="3841:115005"
    >
      <div className={css.mezzanine} data-node-id="3841:115007">
        <div className={simulating ? `${css.mezzLeft} ${css.mezzLeftSim}` : css.mezzLeft}>
          <div className={css.testDropdownWrap} ref={testDropdownRef}>
            <button
              type="button"
              className={`${css.testDropdown} ${testMenuOpen ? css.testDropdownOpen : ''}`}
              disabled={testDropdownDisabled}
              aria-haspopup="listbox"
              aria-expanded={testMenuOpen}
              aria-controls={testMenuOpen ? testMenuId : undefined}
              onClick={() => {
                if (!testDropdownDisabled) setTestMenuOpen((open) => !open)
              }}
            >
              <span className={css.testDropdownLabel} title={testRunLabel}>
                {testRunLabel}
              </span>
              <TestDropdownChevron />
            </button>
            {testMenuOpen ? (
              <div
                id={testMenuId}
                className={css.testDropdownMenu}
                role="listbox"
                aria-label="Test run mode"
              >
                {TEST_RUN_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={testRunMode === option.id}
                    className={`${css.testDropdownOption} ${
                      testRunMode === option.id ? css.testDropdownOptionSelected : ''
                    }`}
                    onClick={() => {
                      setTestRunMode(option.id)
                      setTestMenuOpen(false)
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className={css.playback} data-node-id="3841:115016">
            {serverClientsMode ? (
              <>
                <button
                  type="button"
                  className={`${css.iconBtnSm} ${css.playControlBtn}`}
                  aria-label="Play"
                  aria-pressed={simulating && !sessionPaused ? true : undefined}
                  disabled={playbackLocked || (simulating && !sessionPaused)}
                  onClick={handlePlay}
                >
                  <Play
                    size={14}
                    strokeWidth={1.75}
                    fill="currentColor"
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  className={`${css.iconBtnSm} ${css.pauseControlBtn} ${
                    sessionPaused ? css.pauseControlBtnActive : ''
                  }`}
                  aria-label={sessionPaused ? 'Resume' : 'Pause'}
                  aria-pressed={sessionPaused ? true : undefined}
                  disabled={playbackLocked || !simulating}
                  onClick={() => setSessionPaused((paused) => !paused)}
                >
                  <PauseIcon />
                </button>
                <button
                  type="button"
                  className={`${css.iconBtnSm} ${css.exitControlBtn}`}
                  aria-label="Exit"
                  disabled={playbackLocked}
                  onClick={handleExit}
                >
                  <LogOut size={14} strokeWidth={1.75} aria-hidden />
                </button>
                <ClientSpawnSpinbox
                  value={clientSpawnCount}
                  onChange={setClientSpawnCount}
                  disabled={playbackLocked || simulating}
                />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`${css.iconBtnSm} ${css.playControlBtn}`}
                  aria-label="Play"
                  aria-pressed={simulating ? true : undefined}
                  disabled={playbackLocked}
                  onClick={handlePlay}
                >
                  <Play
                    size={14}
                    strokeWidth={1.75}
                    fill="currentColor"
                    aria-hidden
                  />
                </button>
                <div
                  className={simulating ? `${css.splitMuted} ${css.splitMutedSim}` : css.splitMuted}
                  data-node-id="I3841:115016;2531:99353"
                >
                  <div className={css.splitMutedInner}>
                    <button
                      type="button"
                      className={css.splitMutedPart}
                      aria-label="Pause"
                      disabled={playbackLocked}
                    >
                      <PauseIcon />
                    </button>
                    <button
                      type="button"
                      className={css.splitMutedPart}
                      aria-label="Playback menu"
                      disabled={playbackLocked}
                    >
                      <ChevSmSplit />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${css.iconBtnSm} ${css.stopControlBtn}`}
                  aria-label="Stop"
                  disabled={playbackLocked}
                  onClick={handleExit}
                >
                  <Square
                    size={11}
                    strokeWidth={2}
                    fill="currentColor"
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  className={`${css.iconBtnSm} ${css.viewFocusToggleBtn}`}
                  aria-label={viewToggleLabel}
                  disabled={viewToggleDisabled}
                  onClick={() => onSimViewportFocusToggle?.()}
                >
                  {simViewportFocus === 'server' ? (
                    <Server
                      size={16}
                      strokeWidth={1.5}
                      className={css.viewFocusIconServer}
                      aria-hidden
                    />
                  ) : (
                    <Monitor
                      size={16}
                      strokeWidth={1.5}
                      className={css.viewFocusIconClient}
                      aria-hidden
                    />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className={css.centerTabs} data-node-id="3841:115017">
          {RIBBON_TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`${css.ribbonTab} ${t === 'Home' ? css.ribbonTabActive : ''}`}
            >
              {t}
            </button>
          ))}
          <button type="button" className={css.tabPlusBtn} aria-label="Add tab">
            <Plus size={12} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={css.mezzRight} data-node-id="3841:115018">
          <div className={css.userCluster}>
            <button type="button" className={css.iconBtnSm} aria-label="Share">
              <Share2 size={16} strokeWidth={1.5} aria-hidden />
            </button>
            <div className={css.dividerV} />
            <button type="button" className={css.iconBtnSm} aria-label="Assistant">
              <AssistantIcon />
            </button>
            <button type="button" className={css.iconBtnSm} aria-label="Cloud">
              <CloudIcon />
            </button>
            <div className={css.dividerV} />
            <button type="button" className={css.iconBtnSm} aria-label="Notifications">
              <Bell size={16} strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" className={css.avatar} aria-label="Account">
              <CircleUser size={22} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className={css.ribbonRule} data-node-id="3841:115042" />

      <RibbonToolbar />
    </div>
  )
}
