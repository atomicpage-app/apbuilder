import { redirect } from 'next/navigation';
import { createProductDraft } from '@/actions/products/create-draft';

export default async function NewProductPage() {
  const result = await createProductDraft();

  if (!result.ok) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Novo produto</h1>
        <p>Erro ao criar produto.</p>
      </div>
    );
  }

  redirect(`/products/${result.data.productId}`);
}
