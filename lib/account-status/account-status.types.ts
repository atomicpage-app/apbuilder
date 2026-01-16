export type AccountStatus =
  | 'pending_email_verification'
  | 'active'
  | 'suspended'
  | 'disabled'
  | 'deleted';

export type ActorType = 'system' | 'admin' | 'user';

export interface ChangeAccountStatusInput {
  accountId: string;
  toStatus: AccountStatus;
  reason: string;
  actorType: ActorType;
  actorId?: string;
}
