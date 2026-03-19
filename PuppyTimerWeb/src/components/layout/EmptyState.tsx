import React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center smooth-transition">
      <Icon size={64} className="mb-4 smooth-transition" style={{ color: 'rgba(224, 122, 47, 0.2)' }} strokeWidth={1.5} />
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{title}</h2>
      <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
    </div>
  );
};

export default EmptyState;
