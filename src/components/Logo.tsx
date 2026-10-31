import Link from 'next/link';

export function BookmarkIcon({ size = 22, fill = 'var(--kaki)' }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={Math.round(size * 1.36)} viewBox="0 0 22 30" aria-hidden="true">
      <path d="M2 1h18v28l-9-7-9 7z" fill={fill} stroke="var(--sumi)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** With `action`, the right side is a single button (for example "Cancel") instead of the page links. */
export function Header({ action }: { action?: string }) {
  return (
    <header className="site-header">
      <Link href="/" className="logo">
        <BookmarkIcon />
        Animu
      </Link>
      {action ? (
        <Link href="/" className="btn btn-small" style={{ background: 'var(--page)' }}>
          {action}
        </Link>
      ) : (
        <nav className="site-nav" aria-label="Main">
          <Link href="/#bookmarks">My bookmarks</Link>
          <Link href="/#how">How it works</Link>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <span>Animu is open source. Episode data from TVmaze and Kitsu.</span>
      <span className="note">ネタバレなし、約束します。</span>
    </footer>
  );
}

/** Vertical episode ribbon: 第N話 reads "episode N". Without an order it asks where you are. */
export function Ribbon({ order, small = false }: { order: number | null; small?: boolean }) {
  return (
    <div className={`ribbon${small ? ' ribbon-sm' : ''}`} aria-hidden="true">
      <span className="display">第{order ?? '？'}話</span>
      {!small && <span className="note">{order == null ? 'あなたはどこ' : 'あなたはここ'}</span>}
    </div>
  );
}
