import Link from 'next/link';

export function BookmarkIcon({ size = 22, fill = 'var(--kaki)' }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={Math.round(size * 1.36)} viewBox="0 0 22 30" aria-hidden="true">
      <path d="M2 1h18v28l-9-7-9 7z" fill={fill} stroke="var(--sumi)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Header({ nav = true }: { nav?: boolean }) {
  return (
    <header className="site-header">
      <Link href="/" className="logo">
        <BookmarkIcon />
        Animu
      </Link>
      {nav ? (
        <nav className="site-nav" aria-label="Main">
          <Link href="/#bookmarks">My bookmarks</Link>
          <Link href="/#how">How it works</Link>
        </nav>
      ) : (
        <Link href="/" className="btn btn-small" style={{ background: 'var(--page)' }}>
          New search
        </Link>
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

/** Vertical episode ribbon: 第N話 reads "episode N". */
export function Ribbon({ order, small = false }: { order: number; small?: boolean }) {
  return (
    <div className={`ribbon${small ? ' ribbon-sm' : ''}`} aria-hidden="true">
      <span className="display" style={{ fontSize: small ? 32 : 40, letterSpacing: '0.06em' }}>
        第{order}話
      </span>
      {!small && (
        <span className="note" style={{ fontSize: 16 }}>
          あなたはここ
        </span>
      )}
    </div>
  );
}
