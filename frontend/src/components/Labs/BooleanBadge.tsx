import React from 'react';
import { CheckCircle2, XCircle, Minus } from 'lucide-react';

interface BooleanBadgeProps {
  value: boolean | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
  showIcon?: boolean;
}

const BooleanBadge: React.FC<BooleanBadgeProps> = ({ 
  value, 
  trueLabel = 'Yes', 
  falseLabel = 'No',
  showIcon = true 
}) => {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-center gap-1.5 text-gray-500">
        <Minus size={14} />
        <span className="text-xs font-medium">—</span>
      </div>
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
        {showIcon && <CheckCircle2 size={13} />}
        <span className="text-xs font-semibold tracking-wide">{trueLabel}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-gray-400/10 px-2 py-0.5 rounded-md border border-gray-400/20">
      {showIcon && <XCircle size={13} />}
      <span className="text-xs font-semibold tracking-wide">{falseLabel}</span>
    </div>
  );
};

export default BooleanBadge;
