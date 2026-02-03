import { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function AdminPageHeader({
  title,
  description,
  action,
}: Props) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>

      {action && <div>{action}</div>}
    </header>
  );
}
