'use client';

import { useState } from 'react';

import { updateProductDraft } from './actions';

type ProductDraftEditableFields = {
  title: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  cta_label: string | null;
  image_url: string | null;
};

type Props = {
  productId: string;
  initialStatus: 'draft' | 'published' | 'archived';
  initialValues: ProductDraftEditableFields;
};

export default function ProductEditForm({
  productId,
  initialStatus,
  initialValues,
}: Props) {
  const [formData, setFormData] =
    useState<ProductDraftEditableFields>(initialValues);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isReadOnly = initialStatus === 'archived';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isReadOnly) {
      setError('Produto arquivado não pode ser editado.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateProductDraft({
      productId,
      title: formData.title,
      description: formData.description,
      price: formData.price,
      unit: formData.unit,
      cta_label: formData.cta_label,
      image_url: formData.image_url,
    });

    setIsSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSuccess(true);
  }

  function updateField<K extends keyof ProductDraftEditableFields>(
    field: K,
    value: ProductDraftEditableFields[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-6 rounded-lg border border-gray-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        Editar produto
      </h2>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Alterações salvas com sucesso.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Título
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            disabled={isReadOnly}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            value={formData.description ?? ''}
            onChange={(e) => updateField('description', e.target.value || null)}
            disabled={isReadOnly}
            rows={4}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Preço
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price ?? ''}
            onChange={(e) =>
              updateField(
                'price',
                e.target.value ? Number(e.target.value) : null
              )
            }
            disabled={isReadOnly}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Unidade
          </label>
          <input
            type="text"
            value={formData.unit ?? ''}
            onChange={(e) => updateField('unit', e.target.value || null)}
            disabled={isReadOnly}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Texto do botão (CTA)
          </label>
          <input
            type="text"
            value={formData.cta_label ?? ''}
            onChange={(e) => updateField('cta_label', e.target.value || null)}
            disabled={isReadOnly}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            URL da imagem
          </label>
          <input
            type="url"
            value={formData.image_url ?? ''}
            onChange={(e) => updateField('image_url', e.target.value || null)}
            disabled={isReadOnly}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || isReadOnly}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
