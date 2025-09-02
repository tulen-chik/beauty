"use client"
import { useEffect, useState } from "react";
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
  Loader2
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
  const { salonId } = params;
  const { getServicesBySalon, createService, loading, error, getImages, uploadImage, deleteImage } = useSalonService();
  const { getCategoriesBySalon } = useServiceCategory();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [imagesMap, setImagesMap] = useState<Record<string, any[]>>({});
  const [imagesLoading, setImagesLoading] = useState<Record<string, boolean>>({});
  
  // Modal form state
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
      setForm({
        id: editingService.id,
        name: editingService.name ?? "",
        description: editingService.description ?? "",
        price: editingService.price ?? 0,
        durationMinutes: editingService.durationMinutes ?? 30,
        isActive: !!editingService.isActive,
        isApp: !!editingService.isApp,
        categoryIds: editingService.categoryIds ?? []
      });
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
    }
    setFormError(null);
  }, [editingService, showModal]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Название обязательно");
      return;
    }
    if (!form.durationMinutes || form.durationMinutes <= 0) {
      setFormError("Длительность должна быть больше 0");
      return;
    }

    try {
      const idToUse = editingService ? editingService.id : Date.now().toString();
      
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
      
      // Refresh services
      const svc = await getServicesBySalon(salonId);
      setServices(svc || []);
      
      // Refresh images if editing
      if (editingService) {
        const imgs = await getImages(editingService.id);
        setImagesMap(prev => ({ ...prev, [editingService.id]: imgs }));
      }
      
      
      setShowModal(false);
      setEditingService(null);
    } catch (e: any) {
      setFormError(e?.message ?? "Ошибка при сохранении услуги");
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

  const selectedCategories = categories.filter(cat => form.categoryIds?.includes(cat.id));

  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Загрузка услуг...</span>
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
              Управление услугами
            </h1>
            <p className="text-muted-foreground">
              Добавляйте и редактируйте услуги вашего салона
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
            Добавить услугу
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center py-12">
            <div className="max-w-md mx-auto p-6">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Нет услуг</h3>
              <p className="text-muted-foreground mb-6">
                Начните с добавления первой услуги для вашего салона
              </p>
              <button
                onClick={() => {
                  setEditingService(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-white h-10 px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить первую услугу
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
                          <p className="text-sm">Нет фото</p>
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
                              {service.durationMinutes} мин
                            </div>
                            {service.isApp && (
                              <div className="flex items-center gap-1 text-primary">
                                <Smartphone className="h-4 w-4" />
                                <span>Приложение</span>
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
                                <span className="text-success">Активна</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Неактивна</span>
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
                          <span className="text-sm font-medium">Фотографии</span>
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
                              Добавить
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
                  {editingService ? "Редактировать услугу" : "Добавить услугу"}
                </h2>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Название услуги *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Например: Мужская стрижка"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Описание
                    </label>
                    <textarea
                      id="description"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Краткое описание услуги..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="price" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Цена (₽) *
                      </label>
                      <input
                        id="price"
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="duration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Длительность (мин) *
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
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Категории</label>
                    <div className="border rounded-lg p-4 bg-muted/30">
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
                        Услуга активна
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
                        Отображать в приложении
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
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 flex-1 sm:flex-none"
                  >
                    {loading ? "Сохранение..." : (editingService ? "Сохранить изменения" : "Добавить услугу")}
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