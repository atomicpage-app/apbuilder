export type ProductStatus = 'draft' | 'published' | 'archived';

export type TransitionInput = {
  currentStatus: ProductStatus;
  nextStatus: ProductStatus;
  publishedAt: string | null;
};

export type TransitionResult =
  | {
      ok: true;
      patch: {
        status: ProductStatus;
        published_at?: string;
      };
    }
  | {
      ok: false;
      reason: 'INVALID_STATE_TRANSITION';
    };

const ALLOWED_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  draft: ['published', 'archived'],
  published: ['draft'],
  archived: ['draft'],
};

export function applyProductStatusTransition(
  input: TransitionInput
): TransitionResult {
  const { currentStatus, nextStatus, publishedAt } = input;

  if (!ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
    return {
      ok: false,
      reason: 'INVALID_STATE_TRANSITION',
    };
  }

  const patch: {
    status: ProductStatus;
    published_at?: string;
  } = {
    status: nextStatus,
  };

  // Primeira publicação
  if (
    currentStatus === 'draft' &&
    nextStatus === 'published' &&
    !publishedAt
  ) {
    patch.published_at = new Date().toISOString();
  }

  return { ok: true, patch };
}