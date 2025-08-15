'use client';

import Link from 'next/link';

// Define navigation items with their hrefs
const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Start a Match', href: '/start-match/setup' },
  { name: 'Settings', href: '/settings' },
];

export function SidebarNav() {
  return (
    <nav className="flex flex-col p-4 space-y-2 border-r bg-background h-full">
      <h2 className="text-lg font-semibold tracking-tight">Navigation</h2>
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link href={item.href} className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted">
              {item.name}
            </Link>
          </li>
        ))}
        {/* Original placeholder links - removed */}
        {/* <li>
          <Link href="/start-match/setup" className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted">
            Start a Match
          </Link>
        </li>
        <li>
          <Link href="/settings" className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted">
            Settings
          </Link>
        </li>
        Add more navigation items here */}
      </ul>
    </nav>
  );
}