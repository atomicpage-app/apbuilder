import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateProductDraft } from '@/actions/products/update-draft';
import type { Database } from '@/lib/supabase/database.types';

type PageProps = {
  params: { productId: string };
};

type AccountTenant = Pick<
  Database['public']['Tables']['accounts']['Row'],
  'tenant_id'
>;

type BusinessId = Pick<
  Database['public']['Tables']['business']['Row'],
  'id'
>;

type ProductRow = Database['public']['Tables']['products']['Row'];

export default async function EditProductDraftPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) notFound();

  const accountResult = await supabase
    .from('accounts')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (accountResult.error || !accountResult.data) notFound();

  const account: AccountTenant = accountResult.data;

  const businessResult = await supabase
    .from('business')
    .select('id')
    .eq('tenant_id', account.tenant_id)
    .single();

  if (businessResult.error || !businessResult.data) notFound();

  const business: BusinessId = businessResult.data;

  const productResult = await supabase
    .from('products')
    .select('*')
    .eq('id', params.productId)
    .eq('business_id', business.id)
    .single();

  if (
    productResult.error ||
    !productResult.data ||
    productResult.data.status !== 'draft'
  ) {
    notFound();
  }

  const product: ProductRow = productResult.data;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1>Editar produto</h1>

      <form
        action={async (formData) => {
          'use server';

          const priceReaisRaw = formData.get('price_reais');
          const priceCents =
            priceReaisRaw && String(priceReaisRaw).trim() !== ''
              ? Math.round(Number(priceReaisRaw) * 100)
              : null;

          await updateProductDraft({
            productId: params.productId,
            title: String(formData.get('title') || ''),
            short_description: formData.get('short_description')
              ? String(formData.get('short_description'))
              : null,
            description: formData.get('description')
              ? String(formData.get('description'))
              : null,
            type: formData.get('type') as Database['public']['Enums']['product_type'],
            price_cents: priceCents,
            currency: formData.get('currency')
              ? String(formData.get('currency'))
              : null,
            cta_label: formData.get('cta_label')
              ? String(formData.get('cta_label'))
              : null,
            image_url: formData.get('image_url')
              ? String(formData.get('image_url'))
              : null,
            position: Number(formData.get('position') || 0),
          });
        }}
      >
        <label>
          Título
          <input name="title" defaultValue={product.title} />
        </label>

        <label>
          Tipo
          <select name="type" defaultValue={product.type}>
            <option value="service">Serviço</option>
            <option value="product">Produto</option>
            <option value="package">Pacote</option>
          </select>
        </label>

        <label>
          Preço (R$)
          <input
            name="price_reais"
            type="number"
            step="0.01"
            defaultValue={
              product.price_cents != null ? product.price_cents / 100 : ''
            }
          />
        </label>

        <label>
          Descrição curta
          <textarea
            name="short_description"
            defaultValue={product.short_description ?? ''}
          />
        </label>

        <label>
          Descrição
          <textarea
            name="description"
            defaultValue={product.description ?? ''}
          />
        </label>

        <label>
          CTA
          <input name="cta_label" defaultValue={product.cta_label ?? ''} />
        </label>

        <label>
          Imagem (URL)
          <input name="image_url" defaultValue={product.image_url ?? ''} />
        </label>

        <label>
          Posição
          <input
            name="position"
            type="number"
            defaultValue={product.position}
          />
        </label>

        <label>
          Moeda
          <input name="currency" defaultValue={product.currency ?? 'BRL'} />
        </label>

        <button type="submit">Salvar rascunho</button>
      </form>
    </div>
  );
}
