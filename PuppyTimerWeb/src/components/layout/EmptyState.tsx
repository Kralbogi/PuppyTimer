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
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <Icon size={64} className="text-gray-300 mb-4" strokeWidth={1.5} />
      <h2 className="text-xl font-bold text-gray-700 mb-2">{title}</h2>
      <p className="text-sm text-gray-400 max-w-xs">{description}</p>
    </div>
  );
};

export default EmptyState;
