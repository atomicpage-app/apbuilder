'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminBreadcrumb() {
  const pathname = usePathname();

  // Ex.: /products/123/edit → ['products', '123', 'edit']
  const segments = pathname.split('/').filter(Boolean);

  if (!segments.includes('products')) return null;

  const productIndex = segments.indexOf('products');
  const productId = segments[productIndex + 1];

  return (
    <nav className="text-sm text-gray-600">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/products" className="hover:underline">
            Produtos
          </Link>
        </li>

        {productId && (
          <>
            <li>/</li>
            <li className="text-gray-900 font-medium">
              Produto
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
