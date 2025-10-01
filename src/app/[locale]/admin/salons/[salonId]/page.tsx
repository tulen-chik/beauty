"use client";

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useSalonEditDialog } from '@/hooks/useSalonEditDialog';

// import { SalonEditDialog } from '@/components/admin/salon-edit-dialog';

import { useAdmin } from '@/contexts/AdminContext';

export default function SalonDetailsPage() {
  const t = useTranslations("SalonDetailsPage");
  const { salonId } = useParams() as { salonId: string };
  const router = useRouter();
  
  const { 
    fetchSalon, 
    updateSalon, 
    loading, 
    error 
  } = useAdmin();
  
  const [salon, setSalon] = useState<any>(null);
  
  const {
    isOpen: isEditDialogOpen,
    currentSalon,
    openDialog: openEditDialog,
    closeDialog: closeEditDialog
  } = useSalonEditDialog();

  // Load salon data
  useEffect(() => {
    const loadSalon = async () => {
      try {
        const salonData = await fetchSalon(salonId);
        if (salonData) {
          setSalon(salonData);
        } else {
          // Handle case when salon is not found
          console.error('Salon not found:', salonId);
          router.push('/admin/salons');
        }
      } catch (err) {
        console.error('Error loading salon:', err);
      }
    };

    if (salonId) {
      loadSalon();
    }
  }, [salonId, fetchSalon, router, t]);

  const handleSaveSalon = async (updatedSalon: any) => {
    try {
      await updateSalon(salonId, updatedSalon);
      setSalon(updatedSalon);
      closeEditDialog();
    } catch (err) {
      console.error('Error updating salon:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!salon) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{salon.name}</h1>
          <p className="text-gray-600">{salon.address}</p>
        </div>
        <button 
          onClick={() => openEditDialog(salon)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {t('buttons.edit')}
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {t('sections.contactInfo')}
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('fields.phone')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {salon.phone || t('notSpecified')}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('fields.email')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {salon.email || t('notSpecified')}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('fields.website')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {salon.website ? (
                  <a 
                    href={salon.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {salon.website}
                  </a>
                ) : (
                  t('notSpecified')
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('fields.status')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  salon.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {salon.isActive ? t('status.active') : t('status.inactive')}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {t('sections.workingHours')}
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl className="divide-y divide-gray-200">
            {Object.entries(salon.workingHours || {}).map(([day, hours]: [string, any]) => (
              <div key={day} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  {t(`days.${day}`)}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {hours.isClosed !== false ? (
                    <span className="text-gray-500">{t('closed')}</span>
                  ) : (
                    `${hours.open} - ${hours.close}`
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {salon.description && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {t('sections.description')}
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <p className="text-gray-700 whitespace-pre-line">{salon.description}</p>
          </div>
        </div>
      )}

      {/* <SalonEditDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        salon={currentSalon}
        onSave={handleSaveSalon}
      /> */}
    </div>
  );
}
