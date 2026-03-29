import React, { ReactNode } from 'react';

interface Column {
  header: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface ModernTableProps {
  columns: Column[];
  children: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
}

const ModernTable: React.FC<ModernTableProps> = ({ 
  columns, 
  children, 
  isEmpty = false, 
  emptyMessage = "No items found",
  emptySubMessage = "Try adjusting your filters or add a new entry."
}) => {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-white/5 mx-6">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl opacity-50">📂</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{emptyMessage}</h3>
        <p className="text-slate-500 dark:text-gray-500 text-sm max-w-xs mx-auto">
          {emptySubMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-10 overflow-hidden rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111827] shadow-sm dark:shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8fafc] dark:bg-[#161b22] border-b border-gray-200 dark:border-white/5">
            <tr>
              {/* Expansion cell space */}
              <th className="w-10"></th>
              
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-gray-500">
                    {col.header}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModernTable;
