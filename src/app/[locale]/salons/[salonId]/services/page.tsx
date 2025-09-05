"use client"
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSalonService } from "@/contexts/SalonServiceContext";
import { useServiceCategory } from "@/contexts/ServiceCategoryContext";
import { 
  Plus, 
  Edit3, 
  Clock, 
  Upload, 
  X, 
  CheckCircle2, 
  XCircle,
  Smartphone,
  Camera,
  Loader2,
  Check
} from "lucide-react";

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
        createdAt: editingService ? (services.find(s => s.id === editingService.id)?.createdAt ?? new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
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
      
      // ИЗМЕНЕНИЕ: Добавлено обязательное поле 'createdAt'
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
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("header.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("header.subtitle")}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingService(null);
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary h-12 px-6 shadow-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t("header.addServiceButton")}
          </button>
        </div>

        {(serviceError || categoryError) && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {serviceError || categoryError}
          </div>
        )}

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center py-12">
            <div className="max-w-md mx-auto p-6">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("emptyState.title")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("emptyState.description")}
              </p>
              <button
                onClick={() => {
                  setEditingService(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-white h-10 px-4"
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
                <div key={service.id} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-medium transition-all duration-300 group">
                  <div className="p-0">
                    {/* Service Images */}
                    <div className="relative h-48 bg-muted/50 flex items-center justify-center">
                      {imagesLoading[service.id] ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : serviceImages.length > 0 ? (
                        <div className="relative w-full h-full">
                          <img
                            src={serviceImages[0].url}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                          {serviceImages.length > 1 && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 absolute top-2 right-2 bg-background/80 text-foreground">
                              +{serviceImages.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Camera className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">{t("serviceCard.noPhoto")}</p>
                        </div>
                      )}
                      
                      {/* Edit Button */}
                      <button
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-soft"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-6">
                      {/* Service Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-1">
                            {service.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.durationMinutes} {t("serviceCard.minutes")}
                            </div>
                            {service.isApp && (
                              <div className="flex items-center gap-1 text-primary">
                                <Smartphone className="h-4 w-4" />
                                <span>{t("serviceCard.inApp")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {service.price} ₽
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            {service.isActive ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-success" />
                                <span className="text-success">{t("serviceCard.active")}</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("serviceCard.inactive")}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      {/* Categories */}
                      {categoryNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {categoryNames.map((name, index) => (
                            <span key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="shrink-0 bg-border h-[1px] w-full mb-4"></div>

                      {/* Image Management */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{t("serviceCard.photosTitle")}</span>
                          <label className="cursor-pointer">
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
                            <span className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer">
                              <Upload className="h-4 w-4 mr-1" />
                              {t("serviceCard.addPhotoButton")}
                            </span>
                          </label>
                        </div>

                        {serviceImages.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {serviceImages.map((img) => (
                              <div key={img.id} className="relative group/img">
                                <img
                                  src={img.url}
                                  alt="service"
                                  className="w-16 h-16 object-cover rounded-md border"
                                />
                                <button
                                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                  onClick={() => handleImageDelete(service.id, img.storagePath)}
                                >
                                  <X className="h-3 w-3" />
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
          <div className="fixed inset-0 z-50 bg-background/100 backdrop-blur-sm">
            <div
              className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'PageUp' || e.key === 'PageDown') {
                  e.stopPropagation();
                }
              }}
              tabIndex={0}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  {editingService ? t("modal.titleEdit") : t("modal.titleAdd")}
                </h2>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t("modal.form.nameLabel")}
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t("modal.form.namePlaceholder")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t("modal.form.descriptionLabel")}
                    </label>
                    <textarea
                      id="description"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder={t("modal.form.descriptionPlaceholder")}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="price" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t("modal.form.priceLabel", { currency: "₽" })}
                      </label>
                      <input
                        id="price"
                        type="text"
                        inputMode="decimal"
                        value={displayPrice}
                        onChange={handlePriceChange}
                        onFocus={handlePriceFocus}
                        onBlur={handlePriceBlur}
                        placeholder="0"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="duration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t("modal.form.durationLabel")}
                      </label>
                      <input
                        id="duration"
                        type="number"
                        min={1}
                        value={form.durationMinutes}
                        onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium leading-none">
                        {t("modal.form.categoriesLabel")}
                      </label>
                      {!showNewCategoryInput && (
                        <button
                          type="button"
                          onClick={() => setShowNewCategoryInput(true)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                        >
                          <Plus className="h-4 w-4" />
                          {t("modal.form.addCategory")}
                        </button>
                      )}
                    </div>

                    {showNewCategoryInput && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder={t("modal.form.newCategoryPlaceholder")}
                          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim() || isCreatingCategory}
                          className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isCreatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewCategoryInput(false)}
                          className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-background border hover:bg-accent"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <div className="border rounded-lg p-4 bg-muted/30">
                      {categories.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                          {categories.map((cat) => (
                            <label
                              key={cat.id}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={form.categoryIds.includes(cat.id)}
                                onChange={() => toggleCategory(cat.id)}
                                className="h-4 w-4 rounded border border-primary text-primary shadow focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              />
                              <span className="text-sm">{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          {t("modal.form.noCategories")}
                        </p>
                      )}
                      
                      {selectedCategories.length > 0 && (
                        <div className="pt-3 border-t">
                          <div className="flex flex-wrap gap-2">
                            {selectedCategories.map((cat) => (
                              <span key={cat.id} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 gap-1">
                                {cat.name}
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => toggleCategory(cat.id)}
                                />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                        className="h-4 w-4 rounded border border-primary text-primary shadow focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <label htmlFor="isActive" className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t("modal.form.isActiveLabel")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="isApp"
                        type="checkbox"
                        checked={form.isApp}
                        onChange={(e) => setForm(f => ({ ...f, isApp: e.target.checked }))}
                        className="h-4 w-4 rounded border border-primary text-primary shadow focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <label htmlFor="isApp" className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t("modal.form.isAppLabel")}
                      </label>
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingService(null);
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 flex-1 sm:flex-none"
                  >
                    {t("modal.form.cancelButton")}
                  </button>
                  <button
                    type="submit"
                    disabled={serviceLoading || categoryLoading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 flex-1 sm:flex-none"
                  >
                    {(serviceLoading || categoryLoading) ? t("modal.form.savingButton") : (editingService ? t("modal.form.saveButton") : t("modal.form.addButton"))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}