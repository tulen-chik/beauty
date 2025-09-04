"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import {
  MessageCircle, Search, Plus, Edit, Trash2, Eye, Calendar, User, Tag,
  TrendingUp, FileText, Image, MoreVertical, CheckCircle, XCircle, Clock,
  X, Users, Folder, ChevronsUpDown, Type, List, Lightbulb, Star, ListOrdered, Info, Loader2, AlertTriangle, UploadCloud
} from "lucide-react"
import Link from "next/link"

// 1. Импортируем хук из вашего контекста
import { useBlogAdmin } from "@/contexts/BlogAdminContext"
import type { BlogPost, BlogAuthor, BlogCategory } from '@/types/database'

export interface SeoData {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}
// --- ТИПЫ ДАННЫХ (включены для полноты) ---

export type BlockColor =
  | 'gray' | 'rose' | 'pink' | 'purple' | 'indigo' | 'blue' | 'green' | 'yellow';

export interface ParagraphBlock { type: 'paragraph'; content: string; }
export interface HeadingBlock { type: 'heading'; level: 2 | 3 | 4; content: string; }
export interface ListBlock { type: 'list'; items: string[]; }
export interface StepsBlock { type: 'steps'; steps: string[]; }
export interface TipBlock { type: 'tip'; title: string; content: string; color: BlockColor; }
export interface InfoBoxBlock { type: 'infoBox'; title: string; items: string[]; color: BlockColor; }
export interface ProductRatingBlock { type: 'productRating'; name: string; rating: string; description: string; color: BlockColor; }

export type BlogContent =
  | ParagraphBlock | HeadingBlock | ListBlock | StepsBlock | TipBlock | InfoBoxBlock | ProductRatingBlock;

// --- КОМПОНЕНТ РЕДАКТОРА ПОСТОВ ---
const PostEditorModal = ({
  show, onClose, onSave, initialPost, authors, categories, loading, uploadImage
}: {
  show: boolean;
  onClose: () => void;
  onSave: (postData: Partial<BlogPost>) => void;
  initialPost: Partial<BlogPost> | null;
  authors: BlogAuthor[];
  categories: BlogCategory[];
  loading: boolean;
  uploadImage: (postId: string, file: File) => Promise<{
    id: string;
    postId: string;
    url: string;
    storagePath: string;
    uploadedAt: string;
}>;
}) => {
  const [postData, setPostData] = useState<Partial<BlogPost>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const defaultPost: Partial<BlogPost> = {
      title: '', slug: '', excerpt: '', content: [{ type: 'paragraph', content: '' }],
      authorId: authors[0]?.id || '', publishedAt: new Date().toISOString(), readTime: 5,
      categoryId: categories[0]?.id || '', tags: [], image: '', featured: false, status: 'draft',
      seo: { metaTitle: '', metaDescription: '', keywords: [] }
    };
    const initialData = initialPost ? JSON.parse(JSON.stringify(initialPost)) : {};
    setPostData({ ...defaultPost, ...initialData });
    // Сбрасываем состояние загрузки при открытии/смене поста
    setImageFile(null);
    setIsUploading(false);
    setUploadError(null);
  }, [initialPost, show, authors, categories]);

  if (!show) return null;

  const handleFieldChange = (field: keyof BlogPost, value: any) => setPostData(p => ({ ...p, [field]: value }));
  const handleSeoChange = (field: keyof SeoData, value: any) => setPostData(p => ({ ...p, seo: { ...p.seo, [field]: value } }));
  const handleContentChange = (index: number, newContent: any) => {
    const updatedContent = [...(postData.content || [])];
    updatedContent[index] = { ...updatedContent[index], ...newContent };
    setPostData(p => ({ ...p, content: updatedContent }));
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      setUploadError("Файл не выбран.");
      return;
    }
    if (!postData.id) {
      setUploadError("Сначала сохраните статью, чтобы получить ID для загрузки изображения.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const imageData = await uploadImage(postData.id, imageFile);
      handleFieldChange('image', imageData.url);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (e: any) {
      setUploadError(`Ошибка загрузки: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const addContentBlock = (type: BlogContent['type']) => {
    let newBlock: BlogContent;
    switch (type) {
      case 'heading': newBlock = { type, level: 2, content: '' }; break;
      case 'list': newBlock = { type, items: [''] }; break;
      case 'tip': newBlock = { type, title: '', content: '', color: 'rose' }; break;
      case 'productRating': newBlock = { type, name: '', rating: '', description: '', color: 'green' }; break;
      case 'steps': newBlock = { type, steps: [''] }; break;
      case 'infoBox': newBlock = { type, title: '', items: [''], color: 'gray' }; break;
      default: newBlock = { type: 'paragraph', content: '' };
    }
    setPostData(p => ({ ...p, content: [...(p.content || []), newBlock] }));
  };

  const removeContentBlock = (index: number) => setPostData(p => ({ ...p, content: p.content?.filter((_, i) => i !== index) }));

  const renderContentBlock = (block: BlogContent, index: number) => {
    const blockControls = (
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono uppercase">{block.type}</span>
        <button onClick={() => removeContentBlock(index)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
      </div>
    );

    const colors: { label: string, value: BlockColor }[] = [
        { label: 'Серый', value: 'gray' }, { label: 'Розовый', value: 'rose' }, { label: 'Пурпурный', value: 'pink' },
        { label: 'Фиолетовый', value: 'purple' }, { label: 'Индиго', value: 'indigo' }, { label: 'Синий', value: 'blue' },
        { label: 'Зеленый', value: 'green' }, { label: 'Желтый', value: 'yellow' }
    ];

    const ColorSelector = ({ value, onChange }: { value: BlockColor, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
        <div>
            <label className="label text-xs">Цвет</label>
            <select value={value} onChange={onChange} className="input text-sm py-1">
                {colors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
        </div>
    );

    switch (block.type) {
      case 'paragraph': return <div className="relative p-4 border rounded-md bg-gray-50 space-y-2">{blockControls}<textarea value={block.content} onChange={(e) => handleContentChange(index, { content: e.target.value })} placeholder="Введите текст параграфа..." className="input" rows={4}/></div>;
      case 'heading': return <div className="relative p-4 border rounded-md bg-gray-50 space-y-2">{blockControls}<div className="flex gap-2"><select value={block.level} onChange={(e) => handleContentChange(index, { level: Number(e.target.value) })} className="input w-20"><option value={2}>H2</option><option value={3}>H3</option><option value={4}>H4</option></select><input type="text" value={block.content} onChange={(e) => handleContentChange(index, { content: e.target.value })} placeholder="Введите заголовок..." className="input font-bold"/></div></div>;
      case 'list': case 'steps': {
        const items = block.type === 'list' ? block.items : block.steps;
        const key = block.type === 'list' ? 'items' : 'steps';
        const Icon = block.type === 'list' ? List : ListOrdered;
        return <div className="relative p-4 border rounded-md bg-gray-50 space-y-2">{blockControls}{items.map((item, itemIndex) => (<div key={itemIndex} className="flex items-center gap-2"><Icon size={16} className="text-gray-400 flex-shrink-0" /><input type="text" value={item} onChange={(e) => { const newItems = [...items]; newItems[itemIndex] = e.target.value; handleContentChange(index, { [key]: newItems }); }} placeholder="Элемент списка" className="input"/><button onClick={() => { const newItems = items.filter((_, i) => i !== itemIndex); handleContentChange(index, { [key]: newItems }); }} className="text-gray-400 hover:text-red-500"><X size={16} /></button></div>))}<button onClick={() => handleContentChange(index, { [key]: [...items, ''] })} className="text-sm text-blue-600 hover:underline mt-2">Добавить элемент</button></div>;
      }
      case 'tip': return <div className="relative p-4 border rounded-md bg-gray-50 space-y-2">{blockControls}<div><label className="label text-xs">Заголовок совета</label><input type="text" value={block.title} onChange={e => handleContentChange(index, { title: e.target.value })} className="input"/></div><div><label className="label text-xs">Содержимое</label><textarea value={block.content} onChange={e => handleContentChange(index, { content: e.target.value })} className="input" rows={3}/></div><ColorSelector value={block.color} onChange={e => handleContentChange(index, { color: e.target.value as BlockColor })}/></div>;
      case 'infoBox': return <div className="relative p-4 border rounded-md bg-gray-50 space-y-2">{blockControls}<div><label className="label text-xs">Заголовок инфо-блока</label><input type="text" value={block.title} onChange={e => handleContentChange(index, { title: e.target.value })} className="input"/></div>{block.items.map((item, itemIndex) => (<div key={itemIndex} className="flex items-center gap-2"><Info size={16} className="text-gray-400 flex-shrink-0" /><input type="text" value={item} onChange={(e) => { const newItems = [...block.items]; newItems[itemIndex] = e.target.value; handleContentChange(index, { items: newItems }); }} placeholder="Элемент инфо-блока" className="input"/><button onClick={() => { const newItems = block.items.filter((_, i) => i !== itemIndex); handleContentChange(index, { items: newItems }); }} className="text-gray-400 hover:text-red-500"><X size={16} /></button></div>))}<button onClick={() => handleContentChange(index, { items: [...block.items, ''] })} className="text-sm text-blue-600 hover:underline mt-2">Добавить элемент</button><ColorSelector value={block.color} onChange={e => handleContentChange(index, { color: e.target.value as BlockColor })}/></div>;
      case 'productRating': return <div className="relative p-4 border rounded-md bg-gray-50 space-y-2">{blockControls}<div><label className="label text-xs">Название продукта</label><input type="text" value={block.name} onChange={e => handleContentChange(index, { name: e.target.value })} className="input"/></div><div><label className="label text-xs">Рейтинг (например, 9/10)</label><input type="text" value={block.rating} onChange={e => handleContentChange(index, { rating: e.target.value })} className="input"/></div><div><label className="label text-xs">Описание</label><textarea value={block.description} onChange={e => handleContentChange(index, { description: e.target.value })} className="input" rows={3}/></div><ColorSelector value={block.color} onChange={e => handleContentChange(index, { color: e.target.value as BlockColor })}/></div>;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-10">
      <div className="relative mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">{initialPost ? 'Редактирование статьи' : 'Создание новой статьи'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-medium">Содержимое статьи</h4>
              {postData.content?.map((block, index) => <div key={index}>{renderContentBlock(block, index)}</div>)}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <button onClick={() => addContentBlock('paragraph')} className="btn-add-block"><Type size={14} /> Параграф</button>
                <button onClick={() => addContentBlock('heading')} className="btn-add-block"><ChevronsUpDown size={14} /> Заголовок</button>
                <button onClick={() => addContentBlock('list')} className="btn-add-block"><List size={14} /> Список</button>
                <button onClick={() => addContentBlock('steps')} className="btn-add-block"><ListOrdered size={14} /> Шаги</button>
                <button onClick={() => addContentBlock('tip')} className="btn-add-block"><Lightbulb size={14} /> Совет</button>
                <button onClick={() => addContentBlock('infoBox')} className="btn-add-block"><Info size={14} /> Инфо-блок</button>
                <button onClick={() => addContentBlock('productRating')} className="btn-add-block"><Star size={14} /> Рейтинг</button>
              </div>
            </div>
            <div className="md:col-span-1 space-y-4">
              <h4 className="font-medium">Метаданные</h4>
              <div><label className="label">Заголовок</label><input type="text" value={postData.title || ''} onChange={e => handleFieldChange('title', e.target.value)} className="input" /></div>
              <div><label className="label">URL (слаг)</label><input type="text" value={postData.slug || ''} onChange={e => handleFieldChange('slug', e.target.value)} className="input" /></div>
              <div><label className="label">Краткое описание</label><textarea value={postData.excerpt || ''} onChange={e => handleFieldChange('excerpt', e.target.value)} className="input" rows={3} /></div>
              <div><label className="label">Автор</label><select value={postData.authorId || ''} onChange={e => handleFieldChange('authorId', e.target.value)} className="input">{authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div><label className="label">Категория</label><select value={postData.categoryId || ''} onChange={e => handleFieldChange('categoryId', e.target.value)} className="input">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              
              {/* --- НОВЫЙ БЛОК ЗАГРУЗКИ ИЗОБРАЖЕНИЯ --- */}
              <div className="space-y-2">
                <label className="label">Изображение</label>
                {postData.image && (
                  <div className="relative group">
                    <img src={postData.image} alt="Превью" className="w-full h-40 object-cover rounded-md" />
                    <button 
                      onClick={() => handleFieldChange('image', '')} 
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Удалить изображение"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <div className="p-4 border-2 border-dashed rounded-md text-center space-y-2">
                  <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} 
                    className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imageFile && (
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <button 
                        onClick={handleImageUpload} 
                        disabled={isUploading || !postData.id} 
                        className="btn-secondary text-sm py-1 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UploadCloud size={16} className="mr-2" />}
                        {isUploading ? 'Загрузка...' : 'Загрузить'}
                      </button>
                    </div>
                  )}
                </div>
                {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}
                {!postData.id && <p className="text-xs text-gray-500 mt-1">Сохраните статью, чтобы включить загрузку изображений.</p>}
              </div>
              {/* --- КОНЕЦ НОВОГО БЛОКА --- */}

              <div className="flex items-center space-x-2"><input id="featured" type="checkbox" checked={!!postData.featured} onChange={e => handleFieldChange('featured', e.target.checked)} className="h-4 w-4" /><label htmlFor="featured" className="text-sm text-gray-700">Рекомендуемая статья</label></div>
              <h4 className="font-medium pt-4 border-t">SEO</h4>
              <div><label className="label">Meta Title</label><input type="text" value={postData.seo?.metaTitle || ''} onChange={e => handleSeoChange('metaTitle', e.target.value)} className="input" /></div>
              <div><label className="label">Meta Description</label><textarea value={postData.seo?.metaDescription || ''} onChange={e => handleSeoChange('metaDescription', e.target.value)} className="input" rows={2} /></div>
              <div><label className="label">Ключевые слова (через запятую)</label><input type="text" value={(postData.seo?.keywords || []).join(', ')} onChange={e => handleSeoChange('keywords', e.target.value.split(',').map(k => k.trim()))} className="input" /></div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary">Отмена</button>
          <button onClick={() => onSave(postData)} disabled={loading} className="btn-primary">{loading ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ МОДАЛЬНОГО ОКНА АВТОРОВ ---
const AuthorsModal = ({ show, onClose, authors, onSave, onDelete, loading }: { show: boolean; onClose: () => void; authors: BlogAuthor[]; onSave: (id: string | null, data: Partial<BlogAuthor>) => Promise<void>; onDelete: (author: BlogAuthor) => void; loading: boolean; }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<BlogAuthor | null>(null);
  const [formData, setFormData] = useState<Partial<BlogAuthor>>({ name: '', avatar: '' });

  useEffect(() => { if (!show) { setIsEditing(false); setSelectedAuthor(null); } }, [show]);

  const handleEdit = (author: BlogAuthor) => { setSelectedAuthor(author); setFormData({ name: author.name, avatar: author.avatar }); setIsEditing(true); };
  const handleCreate = () => { setSelectedAuthor(null); setFormData({ name: '', avatar: '' }); setIsEditing(true); };
  const handleSave = async () => { if (!formData.name) return; await onSave(selectedAuthor?.id || null, formData); setIsEditing(false); setSelectedAuthor(null); };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-medium text-gray-900">Управление авторами</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
        {isEditing ? (
          <div>
            <h4 className="text-md font-semibold mb-4">{selectedAuthor ? 'Редактировать автора' : 'Добавить автора'}</h4>
            <div className="space-y-4">
              <div><label className="label">Имя автора</label><input value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="input" /></div>
              <div><label className="label">URL аватара</label><input value={formData.avatar || ''} onChange={e => setFormData(p => ({ ...p, avatar: e.target.value }))} className="input" /></div>
            </div>
            <div className="flex justify-end space-x-3 mt-6"><button onClick={() => setIsEditing(false)} className="btn-secondary">Отмена</button><button onClick={handleSave} disabled={loading} className="btn-primary">{loading ? 'Сохранение...' : 'Сохранить'}</button></div>
          </div>
        ) : (
          <div>
            <div className="mb-4"><button onClick={handleCreate} className="btn-primary flex items-center"><Plus size={16} className="mr-2" /> Добавить автора</button></div>
            <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="th">Автор</th><th className="th text-right">Действия</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{authors.map(author => (<tr key={author.id}><td className="px-6 py-4 whitespace-nowrap">{author.name}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3"><button onClick={() => handleEdit(author)} className="text-gray-600 hover:text-gray-900"><Edit size={16} /></button><button onClick={() => onDelete(author)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button></td></tr>))}</tbody></table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ МОДАЛЬНОГО ОКНА КАТЕГОРИЙ ---
const CategoriesModal = ({ show, onClose, categories, onSave, onDelete, loading }: { show: boolean; onClose: () => void; categories: BlogCategory[]; onSave: (id: string | null, data: Partial<BlogCategory>) => Promise<void>; onDelete: (category: BlogCategory) => void; loading: boolean; }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);
  const [formData, setFormData] = useState<Partial<BlogCategory>>({ name: '', color: 'gray' });

  useEffect(() => { if (!show) { setIsEditing(false); setSelectedCategory(null); } }, [show]);

  const handleEdit = (category: BlogCategory) => { setSelectedCategory(category); setFormData({ name: category.name, color: category.color }); setIsEditing(true); };
  const handleCreate = () => { setSelectedCategory(null); setFormData({ name: '', color: 'gray' }); setIsEditing(true); };
  const handleSave = async () => { if (!formData.name) return; await onSave(selectedCategory?.id || null, formData); setIsEditing(false); setSelectedCategory(null); };

  const colors: { label: string, value: BlockColor }[] = [{ label: 'Серый', value: 'gray' }, { label: 'Розовый', value: 'rose' }, { label: 'Пурпурный', value: 'pink' }, { label: 'Фиолетовый', value: 'purple' }, { label: 'Индиго', value: 'indigo' }, { label: 'Синий', value: 'blue' }, { label: 'Зеленый', value: 'green' }, { label: 'Желтый', value: 'yellow' }];

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-medium text-gray-900">Управление категориями</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
        {isEditing ? (
          <div>
            <h4 className="text-md font-semibold mb-4">{selectedCategory ? 'Редактировать категорию' : 'Добавить категорию'}</h4>
            <div className="space-y-4">
              <div><label className="label">Название категории</label><input value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="input" /></div>
              <div><label className="label">Цвет</label><select value={formData.color || 'gray'} onChange={e => setFormData(p => ({ ...p, color: e.target.value as BlockColor }))} className="input">{colors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
            </div>
            <div className="flex justify-end space-x-3 mt-6"><button onClick={() => setIsEditing(false)} className="btn-secondary">Отмена</button><button onClick={handleSave} disabled={loading} className="btn-primary">{loading ? 'Сохранение...' : 'Сохранить'}</button></div>
          </div>
        ) : (
          <div>
            <div className="mb-4"><button onClick={handleCreate} className="btn-primary flex items-center"><Plus size={16} className="mr-2" /> Добавить категорию</button></div>
            <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="th">Категория</th><th className="th text-right">Действия</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{categories.map(category => (<tr key={category.id}><td className="px-6 py-4 whitespace-nowrap">{category.name}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3"><button onClick={() => handleEdit(category)} className="text-gray-600 hover:text-gray-900"><Edit size={16} /></button><button onClick={() => onDelete(category)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button></td></tr>))}</tbody></table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ ---
export default function AdminContentPage() {
  const {
    posts, authors, categories, loadAll, createPost, updatePost, deletePost,
    createAuthor, updateAuthor, deleteAuthor, createCategory, updateCategory, deleteCategory,
    uploadImage, // Получаем функцию из контекста
    loading, error
  } = useBlogAdmin();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showDeleteAuthorModal, setShowDeleteAuthorModal] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<BlogAuthor | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategory | null>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredPosts = useMemo(() => posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) || post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || post.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }), [posts, searchTerm, statusFilter, categoryFilter]);

  const getAuthorName = (authorId: string) => authors.find(a => a.id === authorId)?.name || "Неизвестный автор";
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || "Без категории";
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });

  const openCreate = () => { setSelectedPost(null); setShowEditorModal(true); };
  const openEdit = (post: BlogPost) => { setSelectedPost(post); setShowEditorModal(true); };

  const handleSavePost = async (postData: Partial<BlogPost>) => {
    if (!postData.title || !postData.slug || !postData.authorId || !postData.categoryId) return;

    if (selectedPost && selectedPost.id) {
      await updatePost(selectedPost.id, postData);
    } else {
      const id = `post_${Date.now()}`;
      // Создаем пост с id, чтобы можно было сразу загружать картинку
      const newPostData = { ...postData, id } as BlogPost;
      await createPost(id, newPostData as Omit<BlogPost, 'id'>);
      // Обновляем selectedPost, чтобы модальное окно получило id
      setSelectedPost(newPostData); 
      // Не закрываем модальное окно, чтобы пользователь мог добавить картинку
      return; 
    }
    setShowEditorModal(false);
    setSelectedPost(null);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    await deletePost(selectedPost.id);
    setShowDeleteModal(false);
    setSelectedPost(null);
  };

  const handleSaveAuthor = async (id: string | null, data: Partial<BlogAuthor>) => {
    if (id) { await updateAuthor(id, data); }
    else { const newId = `author_${Date.now()}`; await createAuthor(newId, { name: data.name!, avatar: data.avatar || '' }); }
  };
  const handleDeleteAuthor = async () => { if (!authorToDelete) return; await deleteAuthor(authorToDelete.id); setShowDeleteAuthorModal(false); setAuthorToDelete(null); };

  const handleSaveCategory = async (id: string | null, data: Partial<BlogCategory>) => {
    if (id) { await updateCategory(id, data); }
    else { const newId = `category_${Date.now()}`; await createCategory(newId, { name: data.name!, color: data.color || 'gray' }); }
  };
  const handleDeleteCategory = async () => { if (!categoryToDelete) return; await deleteCategory(categoryToDelete.id); setShowDeleteCategoryModal(false); setCategoryToDelete(null); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold text-gray-900">Управление контентом</h1><p className="text-gray-600 mt-1">Управление статьями блога и контентом</p></div>
          <div className="flex space-x-2">
            <button onClick={openCreate} className="btn-primary flex items-center"><Plus className="h-4 w-4 mr-2" /> Создать статью</button>
            <button onClick={() => setShowAuthorModal(true)} className="btn-secondary flex items-center"><Users className="h-4 w-4 mr-2" /> Авторы</button>
            <button onClick={() => setShowCategoryModal(true)} className="btn-secondary flex items-center"><Folder className="h-4 w-4 mr-2" /> Категории</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Ошибка</p>
            <p>{error}</p>
          </div>
        )}

        {loading && posts.length === 0 ? (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600" />
            <p className="mt-4 text-gray-500">Загрузка данных...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Поиск статей..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="all">Все статусы</option><option value="published">Опубликовано</option><option value="draft">Черновик</option></select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="all">Все категории</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <div className="flex items-center text-sm text-gray-500">{`Найдено: ${filteredPosts.length} статей`}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr><th className="th">Статья</th><th className="th">Автор</th><th className="th">Категория</th><th className="th">Статус</th><th className="th">Дата публикации</th><th className="th text-right">Действия</th></tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">{filteredPosts.map((post) => (<tr key={post.id} className="hover:bg-gray-50"><td className="px-6 py-4"><div className="flex items-center"><img className="h-12 w-12 rounded-lg object-cover" src={post.image || '/placeholder.svg'} alt={post.title} /><div className="ml-4"><div className="text-sm font-medium text-gray-900 mb-1">{post.title}</div><div className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</div></div></div></td><td className="px-6 py-4 whitespace-nowrap text-sm">{getAuthorName(post.authorId)}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{getCategoryName(post.categoryId)}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`badge ${post.status === 'published' ? 'badge-green' : 'badge-yellow'}`}>{post.status === 'published' ? 'Опубликовано' : 'Черновик'}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(post.publishedAt)}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-end space-x-3"><Link href={`/blog/${post.slug}`} target="_blank" className="text-blue-600 hover:text-blue-900"><Eye size={16} /></Link><button onClick={() => openEdit(post)} className="text-gray-600 hover:text-gray-900"><Edit size={16} /></button><button onClick={() => { setSelectedPost(post); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button></div></td></tr>))}</tbody>
                </table>
              </div>
              {filteredPosts.length === 0 && !loading && (<div className="text-center py-12"><MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">Статьи не найдены</h3><p className="text-gray-500">Попробуйте изменить параметры поиска</p></div>)}
            </div>
          </>
        )}
      </div>

      <PostEditorModal 
        show={showEditorModal} 
        onClose={() => setShowEditorModal(false)} 
        onSave={handleSavePost} 
        initialPost={selectedPost} 
        authors={authors} 
        categories={categories} 
        loading={loading} 
        uploadImage={uploadImage} // Передаем функцию в модальное окно
      />
      <AuthorsModal show={showAuthorModal} onClose={() => setShowAuthorModal(false)} authors={authors} onSave={handleSaveAuthor} onDelete={(author) => { setAuthorToDelete(author); setShowDeleteAuthorModal(true); }} loading={loading} />
      <CategoriesModal show={showCategoryModal} onClose={() => setShowCategoryModal(false)} categories={categories} onSave={handleSaveCategory} onDelete={(category) => { setCategoryToDelete(category); setShowDeleteCategoryModal(true); }} loading={loading} />
      
      {showDeleteModal && selectedPost && (<div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center"><div className="relative p-5 border w-96 shadow-lg rounded-md bg-white"><div className="mt-3 text-center"><div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><Trash2 className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-medium text-gray-900 mt-4">Удалить статью</h3><p className="text-sm text-gray-500 mt-2 px-4">{`Вы уверены, что хотите удалить статью "${selectedPost.title}"?`}</p><div className="items-center px-4 py-3 mt-4 space-x-4"><button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Отмена</button><button onClick={handleDeletePost} className="btn-danger">Удалить</button></div></div></div></div>)}
      {showDeleteAuthorModal && authorToDelete && (<div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center"><div className="relative p-5 border w-96 shadow-lg rounded-md bg-white"><div className="mt-3 text-center"><div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><Trash2 className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-medium text-gray-900 mt-4">Удалить автора</h3><p className="text-sm text-gray-500 mt-2 px-4">{`Вы уверены, что хотите удалить автора "${authorToDelete.name}"?`}</p><div className="items-center px-4 py-3 mt-4 space-x-4"><button onClick={() => setShowDeleteAuthorModal(false)} className="btn-secondary">Отмена</button><button onClick={handleDeleteAuthor} className="btn-danger">Удалить</button></div></div></div></div>)}
      {showDeleteCategoryModal && categoryToDelete && (<div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center"><div className="relative p-5 border w-96 shadow-lg rounded-md bg-white"><div className="mt-3 text-center"><div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><Trash2 className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-medium text-gray-900 mt-4">Удалить категорию</h3><p className="text-sm text-gray-500 mt-2 px-4">{`Вы уверены, что хотите удалить категорию "${categoryToDelete.name}"?`}</p><div className="items-center px-4 py-3 mt-4 space-x-4"><button onClick={() => setShowDeleteCategoryModal(false)} className="btn-secondary">Отмена</button><button onClick={handleDeleteCategory} className="btn-danger">Удалить</button></div></div></div></div>)}
    </div>
  );
}