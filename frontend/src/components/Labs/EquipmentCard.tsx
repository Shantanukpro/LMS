import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EquipmentField {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
}

interface EquipmentCardProps {
  title: string;
  icon: LucideIcon;
  fields: EquipmentField[];
  accentColor?: 'teal' | 'purple' | 'blue' | 'emerald';
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ 
  title, 
  icon: Icon, 
  fields,
  accentColor = 'teal'
}) => {
  const accentCls = 
    accentColor === 'teal' ? 'text-teal-400' : 
    accentColor === 'purple' ? 'text-purple-400' : 
    accentColor === 'emerald' ? 'text-emerald-400' : 'text-blue-400';

  return (
    <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none ${accentCls}`}>
          <Icon size={16} />
        </div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-gray-200">
          {title}
        </h4>
      </div>

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-gray-500">
              {field.label}
            </span>
            <div className="text-[13px] font-medium text-slate-900 dark:text-white flex items-center gap-2">
              {field.icon && <field.icon size={12} className="text-slate-400 dark:text-gray-400" />}
              {field.value || <span className="text-slate-300 dark:text-gray-600">—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquipmentCard;
