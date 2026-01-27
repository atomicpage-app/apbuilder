import { listAdminProducts } from '@/actions/products/list-admin-products';
import { publishProduct } from '@/actions/products/publish-product';
import { archiveProduct } from '@/actions/products/archive-product';
import { revalidatePath } from 'next/cache';

export default async function AdminProductsPage() {
  const result = await listAdminProducts();

  if (!result.ok) {
    return <p>Erro ao carregar produtos</p>;
  }

  async function handlePublish(productId: string) {
    'use server';
    await publishProduct({ productId });
    revalidatePath('/admin/products');
  }

  async function handleArchive(productId: string) {
    'use server';
    await archiveProduct({ productId });
    revalidatePath('/admin/products');
  }

  return (
    <div>
      <h1>Produtos</h1>

      <ul>
        {result.data.map((product) => (
          <li key={product.id}>
            <strong>{product.title}</strong> — {product.status}

            {product.status === 'draft' && (
              <>
                {' '}
                <a href={`/admin/products/${product.id}`}>Editar</a>{' '}
                <form action={handlePublish.bind(null, product.id)}>
                  <button type="submit">Publicar</button>
                </form>
              </>
            )}

            {product.status === 'published' && (
              <form action={handleArchive.bind(null, product.id)}>
                <button type="submit">Arquivar</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
