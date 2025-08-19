"use client";
import { useEffect, useState } from "react";
import { useSalonService } from "@/contexts/SalonServiceContext";
import { useServiceCategory } from "@/contexts/ServiceCategoryContext";
import Image from "next/image";

export default function SalonServicesManagementPage({ params }: { params: { salonId: string } }) {
  const { salonId } = params;
  const { getServicesBySalon, createService, loading, error, getImages, uploadImage, deleteImage } = useSalonService();
  const { getCategoriesBySalon } = useServiceCategory();
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    durationMinutes: 30,
    isActive: true,
    categoryIds: [] as string[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagesMap, setImagesMap] = useState<Record<string, any[]>>({});
  const [imagesLoading, setImagesLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getServicesBySalon(salonId).then(async (services) => {
      setServices(services);
      const map: Record<string, any[]> = {};
      const loadingMap: Record<string, boolean> = {};
      for (const s of services) {
        loadingMap[s.id] = true;
        setImagesLoading({ ...loadingMap });
        map[s.id] = await getImages(s.id);
        loadingMap[s.id] = false;
        setImagesLoading({ ...loadingMap });
      }
      setImagesMap(map);
    });
    getCategoriesBySalon("").then(setCategories);
  }, [salonId, getServicesBySalon, getImages, getCategoriesBySalon]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const id = Date.now().toString();
      await createService(id, {
        salonId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        isActive: form.isActive,
        categoryIds: form.categoryIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setShowForm(false);
      setForm({ name: "", description: "", price: 0, durationMinutes: 30, isActive: true, categoryIds: [] });
      getServicesBySalon(salonId).then(setServices);
      setTimeout(() => setSuccess(false), 1500);
    } catch (e: any) {
      setFormError(e.message || "Ошибка при добавлении услуги");
    }
  };

  const handleImageUpload = async (serviceId: string, file: File) => {
    setImagesLoading((prev) => ({ ...prev, [serviceId]: true }));
    await uploadImage(serviceId, file);
    const imgs = await getImages(serviceId);
    setImagesMap((prev) => ({ ...prev, [serviceId]: imgs }));
    setImagesLoading((prev) => ({ ...prev, [serviceId]: false }));
  };

  const handleImageDelete = async (serviceId: string, storagePath: string) => {
    setImagesLoading((prev) => ({ ...prev, [serviceId]: true }));
    await deleteImage(storagePath);
    const imgs = await getImages(serviceId);
    setImagesMap((prev) => ({ ...prev, [serviceId]: imgs }));
    setImagesLoading((prev) => ({ ...prev, [serviceId]: false }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-3 sm:px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white p-4 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Услуги салона</h1>
          <button
            className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold shadow hover:bg-rose-700 transition-all"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Отмена" : "+ Добавить услугу"}
          </button>
        </div>
        {success && <div className="text-green-600 text-center mb-4">Услуга успешно добавлена!</div>}
        {showForm && (
          <form className="space-y-4 mb-8" onSubmit={handleAdd}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категории</label>
              <select
                multiple
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                value={form.categoryIds}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setForm(f => ({ ...f, categoryIds: options }));
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                  value={form.durationMinutes}
                  onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                id="isActive"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Активна</label>
            </div>
            {formError && <div className="text-red-500 text-sm text-center">{formError}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-rose-600 text-white font-semibold rounded-xl shadow hover:bg-rose-700 transition-all disabled:opacity-50"
            >
              {loading ? "Добавление..." : "Добавить услугу"}
            </button>
          </form>
        )}
        {loading && <div className="text-center text-gray-500">Загрузка...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        <ul className="divide-y divide-gray-100">
          {services.map((s) => (
            <li key={s.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-900">{s.name}</div>
                <div className="text-sm text-gray-600">{s.description}</div>
                <div className="text-xs text-gray-400 mb-2">Длительность: {s.durationMinutes} мин</div>
                {/* Картинки */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {imagesLoading[s.id] && (
                    <span className="text-xs text-gray-400">Загрузка картинок...</span>
                  )}
                  {imagesMap[s.id]?.map((img) => (
                    <div key={img.id} className="relative group">
                      <Image src={img.url} alt="service" width={64} height={64} className="rounded object-cover border" />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(s.id, img.storagePath)}
                        className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-600 opacity-0 group-hover:opacity-100 transition"
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-rose-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(s.id, e.target.files[0]);
                        }
                      }}
                    />
                    <span className="text-2xl text-gray-400">+</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="font-bold text-rose-600 text-lg">{s.price} ₽</div>
                <div className={`text-xs mt-1 ${s.isActive ? "text-green-600" : "text-gray-400"}`}>{s.isActive ? "Активна" : "Неактивна"}</div>
              </div>
            </li>
          ))}
        </ul>
        {!loading && services.length === 0 && (
          <div className="text-center text-gray-500 mt-8">Нет добавленных услуг.</div>
        )}
      </div>
    </div>
  );
} 