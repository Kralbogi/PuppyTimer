import React, { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-start justify-between px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-gradient" style={{ color: 'var(--color-text)' }}>{title}</h1>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4 smooth-transition">{action}</div>}
    </div>
  );
};

export default PageHeader;
