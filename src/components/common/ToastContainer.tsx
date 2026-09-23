import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications, markNotificationRead } = useApp();

  const unreadToasts = notifications.filter((n) => !n.read).slice(0, 4);

  if (unreadToasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none toast-container">
      {unreadToasts.map((toast) => {
        const iconConfig = {
          success: {
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
          },
          warning: {
            icon: AlertTriangle,
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
          },
          error: {
            icon: XCircle,
            color: 'text-rose-500',
            bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
          },
          info: {
            icon: Info,
            color: 'text-sky-500',
            bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
          },
        }[toast.type];

        const Icon = iconConfig.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 ${iconConfig.bg} transition-all duration-300 animate-in fade-in slide-in-from-bottom-5`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconConfig.color}`} />
            <div className="flex-1 min-w-0">
              {toast.title && toast.title !== 'System Notification' && (
                <h4 className="text-xs font-semibold tracking-wide text-slate-900 dark:text-white">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => markNotificationRead(toast.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
