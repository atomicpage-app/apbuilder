'use client';

import { useState } from 'react';
import { updateProductDraftAction } from './actions';
import { ProductDraftEditableFields } from '../../types/product-edit';

type Props = {
  productId: string;
  initialValues: ProductDraftEditableFields;
  initialStatus: 'draft' | 'published';
};

export default function ProductEditForm({
  productId,
  initialValues,
  initialStatus,
}: Props) {
  const [values, setValues] = useState<ProductDraftEditableFields>(initialValues);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const wasPublished = initialStatus === 'published';

  function onChange<K extends keyof ProductDraftEditableFields>(
    key: K,
    value: ProductDraftEditableFields[K]
  ) {
    setValues((v: ProductDraftEditableFields) => ({
      ...v,
      [key]: value,
    }));

    if (status === 'saved') setStatus('idle');
  }

  async function onSubmit() {
    setStatus('saving');
    setMessage(null);

    const result = await updateProductDraftAction({
      productId,
      data: values,
    });

    if (!result.success) {
      setStatus('error');
      setMessage(result.message);
      return;
    }

    setValues(result.product);
    setStatus('saved');
    setMessage(
      wasPublished
        ? 'Alterações salvas. O produto voltou para rascunho.'
        : 'Rascunho salvo com sucesso.'
    );
  }

  return (
    <div>
      {wasPublished && (
        <p>
          Ao salvar, este produto voltará para rascunho e deixará de aparecer
          publicamente até nova publicação.
        </p>
      )}

      <div>
        <label>Título</label>
        <input
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>

      <div>
        <label>Descrição</label>
        <textarea
          value={values.description ?? ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>

      <div>
        <label>Preço</label>
        <input
          type="number"
          value={values.price ?? ''}
          onChange={(e) =>
            onChange('price', e.target.value === '' ? null : Number(e.target.value))
          }
        />
      </div>

      <div>
        <label>Unidade</label>
        <input
          value={values.unit ?? ''}
          onChange={(e) => onChange('unit', e.target.value)}
        />
      </div>

      <div>
        <label>CTA</label>
        <input
          value={values.cta_label ?? ''}
          onChange={(e) => onChange('cta_label', e.target.value)}
        />
      </div>

      <div>
        <label>Imagem (URL)</label>
        <input
          value={values.image_url ?? ''}
          onChange={(e) => onChange('image_url', e.target.value)}
        />
      </div>

      <button onClick={onSubmit} disabled={status === 'saving'}>
        {status === 'saved' ? 'Salvo' : status === 'saving' ? 'Salvando…' : 'Salvar'}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}
