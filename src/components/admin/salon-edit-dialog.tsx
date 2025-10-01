"use client"

import { Check, Clock, Globe, Info, Loader2, Mail, MapPin, Phone, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAdmin } from '@/contexts/AdminContext';

// Define a more complete Salon type that matches the component's usage.
// The original type was missing 'workingHours' and 'isActive'.
type WorkingHours = {
  [key: string]: { open: string; close: string; isClosed?: boolean };
};

interface Salon {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  workingHours?: WorkingHours;
  isActive?: boolean;
  // Include other properties from the original type if needed
  [key: string]: any; 
}

interface SalonEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  salon: Salon | null;
  onSave: (updatedSalon: Salon) => void;
}

// Default working hours structure
const defaultWorkingHours: WorkingHours = {
  monday: { open: '09:00', close: '21:00', isClosed: false },
  tuesday: { open: '09:00', close: '21:00', isClosed: false },
  wednesday: { open: '09:00', close: '21:00', isClosed: false },
  thursday: { open: '09:00', close: '21:00', isClosed: false },
  friday: { open: '09:00', close: '21:00', isClosed: false },
  saturday: { open: '10:00', close: '18:00', isClosed: false },
  sunday: { open: '10:00', close: '18:00', isClosed: true },
};

export function SalonEditDialog({ isOpen, onClose, salon, onSave }: SalonEditDialogProps) {
  const t = useTranslations("SalonEditDialog");
  const { updateSalon, loading } = useAdmin();
  
  const [formData, setFormData] = useState<Partial<Salon>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with salon data when dialog opens or salon changes
  useEffect(() => {
    if (salon) {
      setFormData({
        name: salon.name || '',
        address: salon.address || '',
        phone: salon.phone || '',
        email: salon.email || '',
        website: salon.website || '',
        description: salon.description || '',
        workingHours: salon.workingHours || defaultWorkingHours,
        isActive: salon.isActive !== undefined ? salon.isActive : true,
      });
    } else {
      // Reset form for creation
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        description: '',
        workingHours: defaultWorkingHours,
        isActive: true,
      });
    }
  }, [salon, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleWorkingHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours?.[day],
          [field]: value,
        },
      },
    }));
  };

  // Correctly handle toggling the 'isClosed' status for a day
  const handleDayActiveToggle = (day: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours?.[day],
          isClosed: !isChecked,
        },
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) newErrors.name = t('errors.nameRequired');
    if (!formData.address?.trim()) newErrors.address = t('errors.addressRequired');
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = t('errors.invalidEmail');
    if (formData.website && formData.website.trim() && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = t('errors.invalidUrl');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !salon?.id) return;
    
    setIsSaving(true);
    try {
      // The updateSalon function from context returns void.
      await updateSalon(salon.id, formData);
      
      // Construct the updated salon object to pass to the onSave callback.
      const updatedSalonData: Salon = {
        ...salon,
        ...formData,
      };
      
      onSave(updatedSalonData);
      onClose();
    } catch (error) {
      console.error('Error updating salon:', error);
      setErrors(prev => ({ ...prev, form: t('errors.updateFailed') }));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const daysOfWeek = [
    { key: 'monday', label: t('days.monday') },
    { key: 'tuesday', label: t('days.tuesday') },
    { key: 'wednesday', label: t('days.wednesday') },
    { key: 'thursday', label: t('days.thursday') },
    { key: 'friday', label: t('days.friday') },
    { key: 'saturday', label: t('days.saturday') },
    { key: 'sunday', label: t('days.sunday') },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{salon ? t('editSalon') : t('createSalon')}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isSaving}>
              <X size={24} />
            </button>
          </div>
          
          {errors.form && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{errors.form}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-4 flex items-center">
                  <Info className="mr-2" size={20} />
                  {t('sections.basicInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.name')} *</label>
                    <input
                      type="text" name="name" value={formData.name || ''} onChange={handleInputChange}
                      className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      disabled={isSaving}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  {/* Phone Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.phone')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange}
                        className="w-full pl-10 p-2 border border-gray-300 rounded" disabled={isSaving}
                      />
                    </div>
                  </div>
                  {/* Address Field */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.address')} *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-2 pointer-events-none">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text" name="address" value={formData.address || ''} onChange={handleInputChange}
                        className={`w-full pl-10 p-2 border rounded ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isSaving}
                      />
                    </div>
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.email')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="email" name="email" value={formData.email || ''} onChange={handleInputChange}
                        className={`w-full pl-10 p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isSaving}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  {/* Website Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.website')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="url" name="website" value={formData.website || ''} onChange={handleInputChange}
                        placeholder="https://example.com"
                        className={`w-full pl-10 p-2 border rounded ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={isSaving}
                      />
                    </div>
                    {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
                  </div>
                  {/* Description Field */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.description')}</label>
                    <textarea
                      name="description" value={formData.description || ''} onChange={handleInputChange}
                      rows={3} className="w-full p-2 border border-gray-300 rounded" disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
              
              {/* Working Hours */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-4 flex items-center">
                  <Clock className="mr-2" size={20} />
                  {t('sections.workingHours')}
                </h3>
                <div className="space-y-3">
                  {daysOfWeek.map(({ key, label }) => (
                    <div key={key} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3 font-medium">{label}</div>
                      <div className="col-span-3">
                        <input
                          type="time"
                          value={formData.workingHours?.[key]?.open || '09:00'}
                          onChange={(e) => handleWorkingHoursChange(key, 'open', e.target.value)}
                          className="w-full p-1.5 border border-gray-300 rounded"
                          disabled={isSaving || formData.workingHours?.[key]?.isClosed}
                        />
                      </div>
                      <div className="col-span-1 text-center">-</div>
                      <div className="col-span-3">
                        <input
                          type="time"
                          value={formData.workingHours?.[key]?.close || '21:00'}
                          onChange={(e) => handleWorkingHoursChange(key, 'close', e.target.value)}
                          className="w-full p-1.5 border border-gray-300 rounded"
                          disabled={isSaving || formData.workingHours?.[key]?.isClosed}
                        />
                      </div>
                      <div className="col-span-2 flex items-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!formData.workingHours?.[key]?.isClosed}
                            onChange={(e) => handleDayActiveToggle(key, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                            disabled={isSaving}
                          />
                          <span className="ml-2 text-sm text-gray-700">{t('fields.open')}</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Status & Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox" name="isActive" checked={!!formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    disabled={isSaving}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{t('fields.active')}</span>
                </label>
                <div className="space-x-3">
                  <button
                    type="button" onClick={onClose} disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {t('buttons.cancel')}
                  </button>
                  <button
                    type="submit" disabled={isSaving || loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                  >
                    {isSaving || loading ? (
                      <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />{t('buttons.saving')}</>
                    ) : (
                      <><Check className="-ml-1 mr-2 h-4 w-4" />{t('buttons.save')}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}