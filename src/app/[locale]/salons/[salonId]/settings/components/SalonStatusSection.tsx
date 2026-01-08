'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  AlertCircle,
  Power,
  Save,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { Salon } from '@/types/database';

interface SalonStatusSectionProps {
  salon: Salon | null;
  loading: boolean;
  t: (key: string) => string;
  onSave: (isActive: boolean) => Promise<void>;
}

export default function SalonStatusSection({ 
  salon, 
  loading, 
  t, 
  onSave 
}: SalonStatusSectionProps) {
  const isActive = salon?.isActive ?? false;
  const [localIsActive, setLocalIsActive] = useState(isActive);
  const [saving, setSaving] = useState(false);

  // Sync local state with salon prop changes
  useEffect(() => {
    setLocalIsActive(isActive);
  }, [isActive]);

  const handleToggle = async () => {
    const newStatus = !localIsActive;
    setLocalIsActive(newStatus);
    setSaving(true);
    
    try {
      await onSave(newStatus);
    } catch (error) {
      // Revert on error
      setLocalIsActive(!newStatus);
      console.error('Error updating salon status:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Power className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('sections.status.title')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('sections.status.description')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-medium text-gray-900">
                  {t('sections.status.salonStatus')}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  localIsActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {localIsActive ? t('sections.status.active') : t('sections.status.inactive')}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {localIsActive 
                  ? t('sections.status.activeDescription')
                  : t('sections.status.inactiveDescription')
                }
              </p>
            </div>

            <button
              onClick={handleToggle}
              disabled={saving || loading}
              className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: localIsActive ? '#3B82F6' : '#9CA3AF' }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  localIsActive ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Warning Message */}
          {!localIsActive && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">
                    {t('sections.status.warningTitle')}
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    {t('sections.status.warningDescription')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Status */}
          {saving && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              {t('sections.status.saving')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
