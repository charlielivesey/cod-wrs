import Link from "next/link";

const links = [
  { href: "/", label: "LAN Explorer" },
  { href: "/closed-qualifiers", label: "Closed Qualifiers" },
  { href: "/open-qualifiers", label: "Open Qualifiers" },
  { href: "/players", label: "Player Leaderboard" },
];

export function TopNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">COD WRS</p>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Scoring Dashboard</h1>
        </div>
        <nav className="flex items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
