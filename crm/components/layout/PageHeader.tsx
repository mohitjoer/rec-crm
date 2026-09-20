import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight transition-colors">
          {title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 transition-colors">
          {description}
        </p>
      </div>
      {action && <div className="self-start sm:self-auto">{action}</div>}
    </div>
  );
}
