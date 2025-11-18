"use client"

import { AlertCircle, CheckCircle, LogOut, UserCircle, XCircle, Camera, Save } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { User } from "@/types/database";

type FormErrors = {
  displayName?: string;
  avatar?: string;
  general?: string;
};

interface ProfileSettingsProps {
  currentUser: User;
  onSaveProfile: (displayName: string) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onAvatarRemove: () => Promise<void>;
  onLogout: () => Promise<void>;
  saving: boolean;
  isAvatarUploading: boolean;
  msg: string | null;
  errors: FormErrors;
  t: (key: string) => string;
}

export default function ProfileSettings({
  currentUser, onSaveProfile, onAvatarUpload, onAvatarRemove, onLogout,
  saving, isAvatarUploading, msg, errors, t
}: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(currentUser.displayName || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(currentUser.displayName || "");
  }, [currentUser.displayName]);

  const avatarInitials = useMemo(() => {
    const name = currentUser?.displayName || currentUser?.email || '';
    if (!name) return '';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || '').join('');
  }, [currentUser]);

  const validateProfile = (): boolean => {
    const newErrors: FormErrors = {};
    if (!displayName.trim()) {
      newErrors.displayName = "Имя не может быть пустым";
    }
    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateProfile()) {
      onSaveProfile(displayName);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 2MB
        setLocalErrors({ ...localErrors, avatar: "Размер файла не должен превышать 2 МБ." });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setLocalErrors({ ...localErrors, avatar: "Пожалуйста, выберите изображение (JPG, PNG, WEBP)." });
        return;
      }
      setLocalErrors({});
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const cancelAvatarChange = () => {
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (avatarFile) {
      await onAvatarUpload(avatarFile);
      cancelAvatarChange();
    }
  };

  const allErrors = { ...errors, ...localErrors };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl mb-6 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800">{t('settings.title')}</h2>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Notifications */}
        {msg && (
          <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{msg}</span>
          </div>
        )}
        {allErrors.general && (
          <div className="flex items-center gap-3 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2">
            <XCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{allErrors.general}</span>
          </div>
        )}

        {/* Avatar Section */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-4">Аватар профиля</label>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="relative h-28 w-28 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-slate-100">
                {avatarPreviewUrl ? (
                  <Image src={avatarPreviewUrl} alt="Preview" fill className="object-cover" />
                ) : currentUser.avatarUrl ? (
                  <Image src={currentUser.avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-rose-50 text-rose-500">
                    {avatarInitials ? (
                      <span className="font-bold text-3xl">{avatarInitials}</span>
                    ) : (
                      <UserCircle className="h-16 w-16 opacity-50" />
                    )}
                  </div>
                )}
                
                {/* Overlay for upload */}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isAvatarUploading} 
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-[2px]"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Изменить</span>
                </button>

                {isAvatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                    <div className="h-8 w-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
              
              {!avatarFile ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isAvatarUploading} 
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    Загрузить фото
                  </button>
                  {currentUser.avatarUrl && (
                    <button 
                      onClick={onAvatarRemove} 
                      disabled={isAvatarUploading} 
                      className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-left-2">
                  <button 
                    onClick={handleUpload} 
                    disabled={isAvatarUploading} 
                    className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:bg-rose-400 shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isAvatarUploading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    onClick={cancelAvatarChange} 
                    disabled={isAvatarUploading} 
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Отмена
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Поддерживаются JPG, PNG, WEBP. Максимальный размер 20 МБ.
              </p>
              {allErrors.avatar && (
                <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 p-2 rounded-lg border border-rose-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{allErrors.avatar}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100 w-full" />

        {/* Name Section */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-semibold text-slate-700 mb-2">{t('settings.name')}</label>
          <div className="max-w-md">
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (localErrors.displayName) {
                  const newErrors = { ...localErrors };
                  delete newErrors.displayName;
                  setLocalErrors(newErrors);
                }
              }}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all outline-none focus:bg-white ${
                allErrors.displayName 
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' 
                  : 'border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
              }`}
              placeholder="Ваше имя"
            />
            {allErrors.displayName && (
              <div className="flex items-center gap-2 text-rose-600 mt-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{allErrors.displayName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button 
            disabled={saving || isAvatarUploading} 
            onClick={handleSave} 
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Сохранение...</span>
              </>
            ) : (
              t('settings.saveProfile')
            )}
          </button>

          <button 
            onClick={onLogout} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из аккаунта</span>
          </button>
        </div>
      </div>
    </div>
  );
}