export type ProductDraftEditableFields = {
  title: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  cta_label: string | null;
  image_url: string | null;
};

export type UpdateProductDraftPayload = {
  productId: string;
  data: Partial<ProductDraftEditableFields>;
};

export type UpdateProductDraftResult =
  | { success: true; product: ProductDraftEditableFields }
  | { success: false; code: 'NOT_FOUND' | 'NOT_DRAFT' | 'VALIDATION_ERROR' | 'UNKNOWN'; message: string };
