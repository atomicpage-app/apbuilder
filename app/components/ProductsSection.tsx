import Link from 'next/link';

type ProductItem = {
  id: string;
  title: string;
  status: string;
};

type Props = {
  products: ProductItem[];
};

export default function ProductsSection({ products }: Props) {
  return (
    <section className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Produtos</h2>
          <p className="text-sm text-gray-500">
            Gerencie os produtos do seu negócio
          </p>
        </div>

        <Link
          href="/products/new"
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          + Criar produto
        </Link>
      </div>

      <ul className="divide-y">
        {products.length === 0 && (
          <li className="py-4 text-sm text-gray-500">
            Nenhum produto cadastrado ainda.
          </li>
        )}

        {products.map((product) => (
          <li
            key={product.id}
            className="flex items-center justify-between py-3"
          >
            <Link
              href={`/products/${product.id}`}
              className="font-medium hover:underline"
            >
              {product.title}
            </Link>

            <span className="text-xs rounded-full border px-2 py-1 text-gray-600">
              {product.status}
            </span>
          </li>
        ))}
      </ul>

      <div>
        <Link
          href="/products"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Ver todos os produtos →
        </Link>
      </div>
    </section>
  );
}
