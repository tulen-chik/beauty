"use client";

import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  Plus,
  Settings,
  Smartphone,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useParams } from 'next/navigation';
import { useCallback,useEffect, useState } from 'react';

import { useAdmin } from '@/contexts/AdminContext';

import type { SalonSchedule,SalonService, SalonWorkDay, ServiceCategory, WeekDay } from '@/types/database';

// Define the type for images if it's not already defined globally
interface ServiceImage {
  id: string;
  url: string;
  storagePath: string;
}

interface ServiceFormData {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  isApp: boolean;
  categoryIds: string[];
}

const WEEKDAYS = [
    { key: "monday", fullLabel: "Monday" },
    { key: "tuesday", fullLabel: "Tuesday" },
    { key: "wednesday", fullLabel: "Wednesday" },
    { key: "thursday", fullLabel: "Thursday" },
    { key: "friday", fullLabel: "Friday" },
    { key: "saturday", fullLabel: "Saturday" },
    { key: "sunday", fullLabel: "Sunday" },
];

export default function SalonServicesPage() {
  const { salonId } = useParams() as { salonId: string };

  // Adapted for use with AdminContext
  const {
    getSalonServices,
    createService,
    updateService,
    deleteService,
    categories: allCategories,
    loadCategories,
    createCategory,
    getImages,
    uploadImage,
    deleteImage,
    loading: adminLoading,
    error: adminError,
    getSchedule,
    updateSchedule,
  } = useAdmin();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<SalonService | null>(null);
  const [imagesMap, setImagesMap] = useState<Record<string, ServiceImage[]>>({});
  const [imagesLoading, setImagesLoading] = useState<Record<string, boolean>>({});
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<SalonWorkDay[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<ServiceFormData>({
    id: "",
    name: "",
    description: "",
    price: 0,
    durationMinutes: 30,
    isActive: true,
    isApp: false,
    categoryIds: [],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [displayPrice, setDisplayPrice] = useState("0");

  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!salonId) return;

    const salonServices = await getSalonServices(salonId);
    setServices(salonServices || []);

    const imagePromises = (salonServices || []).map(async (s) => {
      setImagesLoading(prev => ({ ...prev, [s.id]: true }));
      try {
        const serviceImages = await getImages(s.id);
        return { serviceId: s.id, images: serviceImages };
      } catch (error) {
        console.error(`Failed to load images for service ${s.id}:`, error);
        return { serviceId: s.id, images: [] };
      } finally {
        setImagesLoading(prev => ({ ...prev, [s.id]: false }));
      }
    });

    const imagesResults = await Promise.all(imagePromises);
    const newImagesMap = imagesResults.reduce((acc, result) => {
      acc[result.serviceId] = result.images;
      return acc;
    }, {} as Record<string, ServiceImage[]>);
    setImagesMap(newImagesMap);

    await loadCategories();
  }, [salonId, getSalonServices, getImages, loadCategories]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const salonCategories = allCategories.filter(cat => cat.salonId === salonId);
    setCategories(salonCategories || []);
  }, [allCategories, salonId]);

  useEffect(() => {
    if (editingService) {
      const price = editingService.price ?? 0;
      setForm({
        id: editingService.id,
        name: editingService.name ?? "",
        description: editingService.description ?? "",
        price: price,
        durationMinutes: editingService.durationMinutes ?? 30,
        isActive: editingService.isActive,
        isApp: !!editingService.isApp,
        categoryIds: editingService.categoryIds ?? []
      });
      setDisplayPrice(String(price));
    } else {
      setForm({
        id: "", name: "", description: "", price: 0,
        durationMinutes: 30, isActive: true, isApp: false, categoryIds: []
      });
      setDisplayPrice("0");
    }
    setFormError(null);
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  }, [editingService, showModal]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Service name is required.");
      return;
    }
    if (!form.durationMinutes || form.durationMinutes <= 0) {
      setFormError("Duration must be a positive number.");
      return;
    }

    try {
      const serviceData = {
        salonId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        isActive: form.isActive,
        isApp: !!form.isApp,
        categoryIds: form.categoryIds,
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await createService(serviceData);
      }

      await loadAllData();
      setShowModal(false);
      setEditingService(null);
    } catch (e: any) {
      setFormError(e?.message ?? "An error occurred while saving.");
    }
  };

  const handleEdit = (service: SalonService) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteService(serviceId);
        await loadAllData();
      } catch (error: any) {
        console.error("Failed to delete service:", error);
        alert(error.message || "Failed to delete service.");
      }
    }
  };

  const handleAddImage = async (serviceId: string, file: File) => {
    setImagesLoading((prev) => ({ ...prev, [serviceId]: true }));
    try {
      await uploadImage(serviceId, file);
      const imgs = await getImages(serviceId);
      setImagesMap((prev) => ({ ...prev, [serviceId]: imgs }));
    } catch (e) {
      console.error("Failed to upload image", e);
    } finally {
      setImagesLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleImageDelete = async (serviceId: string, storagePath: string) => {
    setImagesLoading((prev) => ({ ...prev, [serviceId]: true }));
    try {
      await deleteImage(storagePath);
      const imgs = await getImages(serviceId);
      setImagesMap((prev) => ({ ...prev, [serviceId]: imgs }));
    } catch (e) {
      console.error("Failed to delete image", e);
    } finally {
      setImagesLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setForm(prev => {
      const isSelected = prev.categoryIds.includes(categoryId);
      if (isSelected) {
        return { ...prev, categoryIds: prev.categoryIds.filter(id => id !== categoryId) };
      }
      if (prev.categoryIds.length >= 6) {
        setFormError("You can select up to 6 categories.");
        return prev;
      }
      return { ...prev, categoryIds: [...prev.categoryIds, categoryId] };
    });
  };

  const getCategoryNames = (categoryIds: string[] = []) => {
    return categories.filter(cat => categoryIds?.includes(cat.id)).map(cat => cat.name);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setDisplayPrice(value);
      setForm(f => ({ ...f, price: isNaN(parseFloat(value)) ? 0 : parseFloat(value) }));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    setFormError(null);
    try {
      const newCategoryId = `cat_${Date.now()}`;
      await createCategory(newCategoryId, { salonId, name: newCategoryName.trim(), createdAt: new Date().toString() });

      await loadCategories();

      toggleCategory(newCategoryId);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
    } catch (error: any) {
      setFormError(error.message || "Failed to create category.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleOpenScheduleModal = async () => {
    const schedule = await getSchedule(salonId);
    setWeeklySchedule(
      schedule?.weeklySchedule ||
      WEEKDAYS.map((d) => ({
        day: d.key as WeekDay,
        isOpen: false,
        times: [],
      }))
    );
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    setModalError(null);
    try {
      const scheduleToSave: Partial<SalonSchedule> = {
        salonId,
        updatedAt: new Date().toISOString(),
        weeklySchedule: weeklySchedule.map(day => ({
          ...day,
          times: day.isOpen ? (day.times || []).filter(t => t.start && t.end) : [],
        })),
      };

      await updateSchedule(salonId, scheduleToSave);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setTimeout(() => setIsScheduleModalOpen(false), 500);
    } catch (e: unknown) {
      console.error("Error saving schedule:", e);
      const errorMessage = e instanceof Error ? e.message : "Could not save schedule. Please try again.";
      setModalError(errorMessage);
    }
  };

  const handleOpenToggle = (dayIdx: number, isOpen: boolean) => {
    setWeeklySchedule(prev => prev.map((d, i) =>
      i === dayIdx ? {
        ...d,
        isOpen,
        times: isOpen && (!d.times || d.times.length === 0) ? [{ start: "09:00", end: "18:00" }] : isOpen ? (d.times || []) : []
      } : d
    ));
  };

  const handleTimeChange = (dayIdx: number, timeIdx: number, field: "start" | "end", value: string) => {
    setWeeklySchedule(prev => prev.map((d, i) =>
      i === dayIdx ? {
        ...d,
        times: (d.times || []).map((t, j) => j === timeIdx ? { ...t, [field]: value } : t)
      } : d
    ));
  };

  const handleAddInterval = (dayIdx: number) => {
    setWeeklySchedule(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, times: [...(d.times || []), { start: "09:00", end: "18:00" }] } : d
    ));
  };

  const handleRemoveInterval = (dayIdx: number, timeIdx: number) => {
    setWeeklySchedule(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, times: (d.times || []).filter((_, j) => j !== timeIdx) } : d
    ));
  };

  if (adminLoading && services.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Salon Services</h1>
            <p className="text-gray-600">Manage the services offered by this salon.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenScheduleModal}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 h-12 px-6 shadow-sm"
            >
              <Settings className="h-5 w-5 mr-2" />
              Manage Schedule
            </button>
            <button
              onClick={() => { setEditingService(null); setShowModal(true); }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 h-12 px-6 shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Service
            </button>
          </div>
        </div>

        {adminError && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{adminError}</div>}

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="rounded-lg border bg-white text-center py-12">
            <div className="max-w-md mx-auto p-6">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No services yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first service.</p>
              <button
                onClick={() => { setEditingService(null); setShowModal(true); }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Service
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const categoryNames = getCategoryNames(service.categoryIds || []);
              const serviceImages = imagesMap[service.id] || [];

              return (
                <div key={service.id} className="rounded-lg border bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="p-0">
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                      {imagesLoading[service.id] ? (
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      ) : serviceImages.length > 0 ? (
                        <img src={serviceImages[0].url} alt={service.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-gray-500">
                          <Camera className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">No Photo</p>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(service)} className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-white hover:bg-blue-50 text-blue-600 shadow-md"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(service.id)} className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-white hover:bg-red-50 text-red-600 shadow-md"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{service.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{service.durationMinutes} min</div>
                            {service.isApp && <div className="flex items-center gap-1 text-blue-600"><Smartphone className="h-4 w-4" /><span>In App</span></div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">${service.price}</div>
                          <div className={`flex items-center gap-1 text-sm ${service.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                            {service.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <span>{service.isActive ? "Active" : "Inactive"}</span>
                          </div>
                        </div>
                      </div>

                      {service.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description}</p>}
                      {categoryNames.length > 0 && <div className="flex flex-wrap gap-1 mb-4">{categoryNames.map((name, index) => <span key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700">{name}</span>)}</div>}
                      <div className="shrink-0 bg-gray-200 h-[1px] w-full mb-4"></div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Photos</span>
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) { handleAddImage(service.id, e.target.files[0]); } }} />
                            <span className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 h-9 px-3 cursor-pointer"><Upload className="h-4 w-4 mr-1" />Add Photo</span>
                          </label>
                        </div>
                        {serviceImages.length > 0 && <div className="flex flex-wrap gap-2">{serviceImages.map((img) => <div key={img.id} className="relative group/img"><img src={img.url} alt="service" className="w-16 h-16 object-cover rounded-md border" /><button onClick={() => handleImageDelete(service.id, img.storagePath)} className="inline-flex items-center justify-center rounded-full h-6 w-6 p-0 bg-red-600 text-white hover:bg-red-700 absolute -top-2 -right-2 opacity-0 group-hover/img:opacity-100 transition-opacity"><X className="h-3 w-3" /></button></div>)}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white p-6 shadow-lg sm:rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{editingService ? "Edit Service" : "Add New Service"}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Service Name</label>
                  <input id="name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Men's Haircut" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the service..." rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input id="price" type="text" inputMode="decimal" value={displayPrice} onChange={handlePriceChange} placeholder="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <input id="duration" type="number" min={1} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Categories</label>
                    {!showNewCategoryInput && <button type="button" onClick={() => setShowNewCategoryInput(true)} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" />Add Category</button>}
                  </div>
                  {showNewCategoryInput && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-1 h-9 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                      <button type="button" onClick={handleCreateCategory} disabled={!newCategoryName.trim() || isCreatingCategory} className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{isCreatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
                      <button type="button" onClick={() => setShowNewCategoryInput(false)} className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-white border hover:bg-gray-100"><X className="h-4 w-4" /></button>
                    </div>
                  )}
                  <div className="border rounded-lg p-3 bg-gray-50/50 max-h-40 overflow-y-auto">
                    {categories.length > 0 ? <div className="grid grid-cols-2 gap-2">{categories.map((cat) => <label key={cat.id} className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 p-1 rounded-md"><input type="checkbox" checked={form.categoryIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-sm">{cat.name}</span></label>)}</div> : <p className="text-sm text-gray-500 text-center py-2">No categories available.</p>}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <div className="flex items-center space-x-2"><input id="isActive" type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><label htmlFor="isActive" className="text-sm cursor-pointer">Service is Active</label></div>
                  <div className="flex items-center space-x-2"><input id="isApp" type="checkbox" checked={form.isApp} onChange={(e) => setForm(f => ({ ...f, isApp: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><label htmlFor="isApp" className="text-sm cursor-pointer">Available in App</label></div>
                </div>

                {formError && <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{formError}</div>}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
                  <button type="submit" disabled={adminLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50">{adminLoading ? "Saving..." : (editingService ? "Save Changes" : "Add Service")}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Schedule Setup</h2>
                <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {modalError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="space-y-6">
                  {weeklySchedule.map((d, i) => (
                    <div key={d.day} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="font-semibold w-32">{WEEKDAYS.find(w => w.key === d.day)?.fullLabel}</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={d.isOpen}
                            onChange={e => handleOpenToggle(i, e.target.checked)}
                          />
                          <span className="text-sm">Open</span>
                        </label>
                      </div>
                      {d.isOpen && (
                        <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                          {(d.times || []).map((t, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={t.start}
                                onChange={e => handleTimeChange(i, j, "start", e.target.value)}
                                className="px-2 py-1 border rounded-md text-sm w-28"
                              />
                              <span>—</span>
                              <input
                                type="time"
                                value={t.end}
                                onChange={e => handleTimeChange(i, j, "end", e.target.value)}
                                className="px-2 py-1 border rounded-md text-sm w-28"
                              />
                              <button onClick={() => handleRemoveInterval(i, j)} className="text-red-500 hover:text-red-700 p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => handleAddInterval(i)} className="text-blue-600 text-sm font-medium mt-2">
                            Add Interval
                          </button>
                        </div>
                      )}
                    </div>
                  )
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button onClick={() => setIsScheduleModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">
                  Cancel
                </button>
                <button onClick={handleSaveSchedule} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}