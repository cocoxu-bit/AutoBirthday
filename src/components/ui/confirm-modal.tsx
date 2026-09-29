'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  icon,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getIconWrapper = () => {
    if (icon) return icon;
    if (variant === 'danger') {
      return (
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
          <Trash2 className="w-6 h-6 text-rose-600" />
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
        <AlertTriangle className="w-6 h-6 text-violet-600" />
      </div>
    );
  };

  const getConfirmButtonClasses = () => {
    if (variant === 'danger') {
      return 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200';
    }
    if (variant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200';
    }
    return 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200';
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {getIconWrapper()}

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <div className="text-xs text-slate-500 leading-relaxed">
            {description}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`py-3 px-4 font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
