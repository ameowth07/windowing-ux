import './Footer.css';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__left">
        <button type="button" className="app-footer__dropdown">
          <ClockIcon />
          Local
          <ChevronDown />
        </button>
      </div>
      <div className="app-footer__command">
        <input
          type="text"
          className="app-footer__input"
          placeholder="Type a command, use Cmd+↑↓ for history, Cmd+Enter to run"
          readOnly
        />
      </div>
      <div className="app-footer__right">
        <a className="app-footer__library-link" href="#/library" title="Component library">
          Components
        </a>
        <button type="button" className="app-footer__icon-btn" aria-label="Chat">
          <ChatIcon />
        </button>
        <button type="button" className="app-footer__icon-btn" aria-label="Cloud">
          <CloudIcon />
        </button>
        <button type="button" className="app-footer__history-btn">
          History
          <DiamondIcon />
        </button>
      </div>
    </footer>
  );
}

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" fill="none" strokeWidth="1.2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 4v3.5l2.5 1.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v8H5l-3 3V3z" opacity="0.85" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.5 12.5h7a3 3 0 0 0 .5-5.96A4 4 0 0 0 3 8.5a2.5 2.5 0 0 0 1.5 4z" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
      <path d="M4 0 8 4 4 8 0 4z" />
    </svg>
  );
}
