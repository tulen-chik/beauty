"use client"
import { 
  Camera,
  Check,
  CheckCircle2, 
  Clock, 
  Edit3, 
  Loader2,
  Plus, 
  Smartphone,
  Upload, 
  X, 
  XCircle,
  ImageIcon,
  MoreHorizontal
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useSalonService } from "@/contexts/SalonServiceContext";
import { useServiceCategory } from "@/contexts/ServiceCategoryContext";

// --- SKELETON COMPONENTS (Без изменений) ---
const ServiceCardSkeleton = () => (
  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="p-0">
      <div className="h-52 bg-slate-100 animate-pulse"></div>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded animate-pulse"></div>
          <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

const SalonServicesPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div className="space-y-3">
            <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-5 w-80 bg-slate-100 rounded-md animate-pulse"></div>
          </div>
          <div className="h-12 w-full sm:w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <ServiceCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
};

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

export default function SalonServicesPage({ params }: { params: { salonId: string } }) {
  const t = useTranslations("SalonServicesPage");
  const { salonId } = params;
  const { getServicesBySalon, createService, loading: serviceLoading, error: serviceError, getImages, uploadImage, deleteImage } = useSalonService();
  const { getCategoriesBySalon, createCategory, loading: categoryLoading, error: categoryError } = useServiceCategory();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [imagesMap, setImagesMap] = useState<Record<string, any[]>>({});
  const [imagesLoading, setImagesLoading] = useState<Record<string, boolean>>({});
  
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

  useEffect(() => {
    const loadAll = async () => {
      const svc = await getServicesBySalon(salonId);
      setServices(svc || []);
      
      const map: Record<string, any[]> = {};
      const loadingMap: Record<string, boolean> = {};
      
      for (const s of svc || []) {
        loadingMap[s.id] = true;
        setImagesLoading({ ...loadingMap });
        try {
          map[s.id] = await getImages(s.id);
        } catch (error) {
          map[s.id] = [];
        }
        loadingMap[s.id] = false;
        setImagesLoading({ ...loadingMap });
      }
      setImagesMap(map);
      
      const cats = await getCategoriesBySalon(salonId);
      setCategories(cats || []);
    };
    loadAll();
  }, [salonId, getServicesBySalon, getImages, getCategoriesBySalon]);

  useEffect(() => {
    if (editingService) {
      const price = editingService.price ?? 0;
      setForm({
        id: editingService.id,
        name: editingService.name ?? "",
        description: editingService.description ?? "",
        price: price,
        durationMinutes: editingService.durationMinutes ?? 30,
        isActive: !!editingService.isActive,
        isApp: !!editingService.isApp,
        categoryIds: editingService.categoryIds ?? []
      });
      setDisplayPrice(String(price));
    } else {
      setForm({
        id: "",
        name: "",
        description: "",
        price: 0,
        durationMinutes: 30,
        isActive: true,
        isApp: false,
        categoryIds: []
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
      setFormError(t("modal.errors.nameRequired"));
      return;
    }
    if (!form.durationMinutes || form.durationMinutes <= 0) {
      setFormError(t("modal.errors.durationInvalid"));
      return;
    }

    try {
      const idToUse = editingService ? editingService.id : `service_${Date.now()}`;
      
      await createService(idToUse, {
        salonId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        isActive: form.isActive,
        isApp: !!form.isApp,
        categoryIds: form.categoryIds,
      });
      
      const svc = await getServicesBySalon(salonId);
      setServices(svc || []);
      
      if (editingService) {
        const imgs = await getImages(editingService.id);
        setImagesMap(prev => ({ ...prev, [editingService.id]: imgs }));
      }
      
      setShowModal(false);
      setEditingService(null);
    } catch (e: any) {
      setFormError(e?.message ?? t("modal.errors.genericSaveError"));
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleAddImage = async (serviceId: string, file: File) => {
    setImagesLoading((prev) => ({ ...prev, [serviceId]: true }));
    try {
      await uploadImage(serviceId, file);
      const imgs = await getImages(serviceId);
      setImagesMap((prev) => ({ ...prev, [serviceId]: imgs }));
    } catch (e) {
      console.error("can't load image")
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
      console.error("can't load image")
    } finally {
      setImagesLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setForm(prev => {
      if (prev.categoryIds.includes(categoryId)) {
        return {
          ...prev,
          categoryIds: prev.categoryIds.filter(id => id !== categoryId)
        };
      }
      
      if (prev.categoryIds.length >= 6) {
        setFormError(t("modal.errors.maxCategories"));
        return prev;
      }
      
      return {
        ...prev,
        categoryIds: [...prev.categoryIds, categoryId]
      };
    });
  };

  const getCategoryNames = (categoryIds: string[] = []) => {
    return categories
      .filter(cat => categoryIds?.includes(cat.id))
      .map(cat => cat.name);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setDisplayPrice(value);
      const numericValue = parseFloat(value);
      setForm(f => ({
        ...f,
        price: isNaN(numericValue) ? 0 : numericValue
      }));
    }
  };

  const handlePriceFocus = () => {
    if (displayPrice === '0') {
      setDisplayPrice('');
    }
  };

  const handlePriceBlur = () => {
    if (displayPrice.trim() === '' || displayPrice.trim() === '.') {
      setDisplayPrice('0');
      setForm(f => ({ ...f, price: 0 }));
    } else {
      setDisplayPrice(String(parseFloat(displayPrice)));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreatingCategory(true);
    setFormError(null);
    try {
      const newCategoryId = `cat_${Date.now()}`;
      
      const categoryData = {
        salonId: salonId,
        name: newCategoryName.trim(),
        createdAt: new Date().toISOString(),
      };

      const newCategory = await createCategory(newCategoryId, categoryData);
      
      const updatedCats = await getCategoriesBySalon(salonId);
      setCategories(updatedCats || []);
      
      if (newCategory && newCategory.id) {
        toggleCategory(newCategory.id);
      }
      
      setNewCategoryName("");
      setShowNewCategoryInput(false);
    } catch (error: any) {
      console.error("Failed to create category:", error);
      setFormError(error.message || t("modal.errors.categoryCreateFailed"));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const selectedCategories = categories.filter(cat => form.categoryIds?.includes(cat.id));

  if (serviceLoading && services.length === 0) {
    return <SalonServicesPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t("header.title")}
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl">
              {t("header.subtitle")}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingService(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 bg-rose-600 text-white hover:bg-rose-700 active:scale-95 h-12 px-6 shadow-lg shadow-rose-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t("header.addServiceButton")}
          </button>
        </div>

        {(serviceError || categoryError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <p>{serviceError || categoryError}</p>
          </div>
        )}

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t("emptyState.title")}</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                {t("emptyState.description")}
              </p>
              <button
                onClick={() => {
                  setEditingService(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 h-11 px-6 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("emptyState.addFirstServiceButton")}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const categoryNames = getCategoryNames(service.categoryIds || []);
              const serviceImages = imagesMap[service.id] || [];
              
              return (
                <div key={service.id} className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all duration-300 overflow-hidden">
                  
                  {/* Image Section */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    {imagesLoading[service.id] ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                      </div>
                    ) : serviceImages.length > 0 ? (
                      <>
                        <img
                          src={serviceImages[0].url}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                        {serviceImages.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            <span>+{serviceImages.length - 1}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Camera className="h-12 w-12 mb-2 opacity-50" />
                        <span className="text-sm font-medium">{t("serviceCard.noPhoto")}</span>
                      </div>
                    )}

                    {/* Edit Button - Visible on mobile, hover on desktop */}
                    <button
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-700 shadow-sm hover:bg-white hover:text-rose-600 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-[-10px] sm:group-hover:translate-y-0 duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(service);
                      }}
                      aria-label="Edit service"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">
                        {service.name}
                      </h3>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-lg font-bold text-rose-600 whitespace-nowrap">
                          {service.price} ₽
                        </span>
                      </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium">{service.durationMinutes} {t("serviceCard.minutes")}</span>
                      </div>
                      
                      {service.isApp && (
                        <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                          <Smartphone className="h-3.5 w-3.5" />
                          <span className="font-medium">{t("serviceCard.inApp")}</span>
                        </div>
                      )}

                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${service.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {service.isActive ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="font-medium">{t("serviceCard.active")}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="font-medium">{t("serviceCard.inactive")}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
                        {service.description}
                      </p>
                    )}

                    {/* Categories */}
                    <div className="mt-auto">
                      {categoryNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {categoryNames.slice(0, 3).map((name, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {name}
                            </span>
                          ))}
                          {categoryNames.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-500">
                              +{categoryNames.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="h-4 mb-4"></div> // Spacer if no categories
                      )}

                      <div className="h-px bg-slate-100 w-full mb-4" />

                      {/* Image Actions */}
                      <div className="flex items-center justify-between">
                        <label className="cursor-pointer group/upload flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleAddImage(service.id, e.target.files[0]);
                              }
                            }}
                          />
                          <div className="p-1.5 rounded-md bg-slate-100 group-hover/upload:bg-rose-50 transition-colors">
                            <Upload className="h-4 w-4" />
                          </div>
                          <span>{t("serviceCard.addPhotoButton")}</span>
                        </label>

                        {serviceImages.length > 0 && (
                          <div className="flex -space-x-2">
                            {serviceImages.slice(0, 3).map((img) => (
                              <div key={img.id} className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden ring-1 ring-slate-100">
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                <button
                                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                  onClick={() => handleImageDelete(service.id, img.storagePath)}
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
            
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
              role="dialog"
              aria-modal="true"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingService ? t("modal.titleEdit") : t("modal.titleAdd")}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="serviceForm" onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                        {t("modal.form.nameLabel")}
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder={t("modal.form.namePlaceholder")}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-200 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                        {t("modal.form.descriptionLabel")}
                      </label>
                      <textarea
                        id="description"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder={t("modal.form.descriptionPlaceholder")}
                        className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-200 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="price" className="text-sm font-semibold text-slate-700">
                          {t("modal.form.priceLabel", { currency: "₽" })}
                        </label>
                        <div className="relative">
                          <input
                            id="price"
                            type="text"
                            inputMode="decimal"
                            value={displayPrice}
                            onChange={handlePriceChange}
                            onFocus={handlePriceFocus}
                            onBlur={handlePriceBlur}
                            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-8 text-sm font-medium text-slate-900 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-200 transition-all outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₽</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="duration" className="text-sm font-semibold text-slate-700">
                          {t("modal.form.durationLabel")}
                        </label>
                        <div className="relative">
                          <input
                            id="duration"
                            type="number"
                            min={1}
                            value={form.durationMinutes}
                            onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                            className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 text-sm font-medium text-slate-900 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-200 transition-all outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">мин</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700">
                          {t("modal.form.categoriesLabel")}
                        </label>
                        {!showNewCategoryInput && (
                          <button
                            type="button"
                            onClick={() => setShowNewCategoryInput(true)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-md transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            {t("modal.form.addCategory")}
                          </button>
                        )}
                      </div>

                      {showNewCategoryInput && (
                        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder={t("modal.form.newCategoryPlaceholder")}
                            className="flex-1 h-9 rounded-lg border-none bg-white px-3 text-sm focus:ring-2 focus:ring-rose-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim() || isCreatingCategory}
                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
                          >
                            {isCreatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowNewCategoryInput(false)}
                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        {categories.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => {
                              const isSelected = form.categoryIds.includes(cat.id);
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => toggleCategory(cat.id)}
                                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                                    isSelected
                                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                      : "bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600"
                                  }`}
                                >
                                  {cat.name}
                                  {isSelected && <Check className="ml-1.5 h-3.5 w-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 text-center py-2">
                            {t("modal.form.noCategories")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${form.isActive ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                          className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-3 text-sm font-medium text-slate-700">{t("modal.form.isActiveLabel")}</span>
                      </label>
                      
                      <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${form.isApp ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <input
                          type="checkbox"
                          checked={form.isApp}
                          onChange={(e) => setForm(f => ({ ...f, isApp: e.target.checked }))}
                          className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-slate-700">{t("modal.form.isAppLabel")}</span>
                      </label>
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                      <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingService(null);
                  }}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  {t("modal.form.cancelButton")}
                </button>
                <button
                  type="submit"
                  form="serviceForm"
                  disabled={serviceLoading || categoryLoading}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                  {(serviceLoading || categoryLoading) ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("modal.form.savingButton")}
                    </span>
                  ) : (
                    editingService ? t("modal.form.saveButton") : t("modal.form.addButton")
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}