'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();

  const isActive =
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        'block rounded-md px-3 py-2 text-sm font-medium',
        isActive
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-700 hover:bg-gray-100',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 bg-white">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">Painel do negócio</p>
            <p className="font-semibold">Admin</p>
          </div>

          <nav className="px-4 py-6 space-y-1">
            <NavLink href="/home" label="Início" />
            <NavLink href="/products" label="Produtos" />

            <span className="block px-3 py-2 text-sm text-gray-400">
              Negócio
            </span>
            <span className="block px-3 py-2 text-sm text-gray-400">
              Conta
            </span>
          </nav>
        </aside>

        {/* Conteúdo */}
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white">
            <div className="px-8 py-4">
              <h1 className="text-lg font-semibold">
                Painel Administrativo
              </h1>
            </div>
          </header>

          <main className="px-8 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
