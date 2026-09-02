import React from 'react';

export const ChartCard = ({ title, subtitle, icon: Icon, children, action }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-slate-700/80 transition-all flex flex-col">
      <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 w-full relative min-h-[260px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
