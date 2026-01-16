import { AccountStatus } from './account-status.types';

const TERMINAL_STATUSES: AccountStatus[] = ['disabled', 'deleted'];

export function isTerminal(status: AccountStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isValidTransition(
  from: AccountStatus,
  to: AccountStatus
): boolean {
  if (from === to) return false;

  if (isTerminal(from)) {
    return false;
  }

  switch (from) {
    case 'pending_email_verification':
      return to === 'active' || to === 'disabled';

    case 'active':
      return ['suspended', 'disabled', 'deleted'].includes(to);

    case 'suspended':
      return ['active', 'disabled', 'deleted'].includes(to);

    default:
      return false;
  }
}
