"use client"

import { motion } from "framer-motion"
import { Search, Calendar, ArrowRight, Clock, Sparkles, TrendingUp, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
// 1. Импортируем хук из вашего контекста
import { useBlogAdmin as useBlog } from "@/contexts/BlogAdminContext" 
import type { BlogPost, BlogCategory } from "@/types/database"

// Отдельный компонент для состояния загрузки для чистоты кода
const LoadingState = () => (
  <div className="flex justify-center items-center min-h-screen bg-white">
    <div className="text-center text-gray-500">
      <Loader2 className="w-12 h-12 mx-auto animate-spin text-rose-500" />
      <p className="mt-4 text-lg font-semibold">Загрузка статей...</p>
    </div>
  </div>
);

export default function BlogPage() {
  // 2. Получаем все необходимые данные и функции из контекста
  const { posts, categories, loading, loadAll } = useBlog();

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 6

  // 3. Запускаем загрузку данных при первом рендере, если их еще нет
  useEffect(() => {
    // Проверяем, нужно ли загружать данные (если они еще не в контексте)
    if (!posts.length && !loading) {
      loadAll();
    }
  }, [loadAll, posts.length, loading]);

  // 4. Мемоизируем все производные данные для оптимизации производительности
  const publishedPosts = useMemo(() => posts.filter((p) => p.status === "published"), [posts]);

  const allCategories = useMemo(() => [
    { id: "all", name: "Все статьи", count: publishedPosts.length },
    ...categories.map((cat) => ({
      ...cat,
      count: publishedPosts.filter((p) => p.categoryId === cat.id).length,
    })),
  ], [categories, publishedPosts]);

  const featuredPosts = useMemo(() => publishedPosts.filter(p => p.featured), [publishedPosts]);

  const filteredPosts = useMemo(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      return publishedPosts.filter(post => 
        post.title.toLowerCase().includes(lowercasedQuery) ||
        post.excerpt.toLowerCase().includes(lowercasedQuery) ||
        post.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))
      );
    } 
    if (selectedCategory !== "all") {
      return publishedPosts.filter(post => post.categoryId === selectedCategory);
    }
    return publishedPosts;
  }, [publishedPosts, searchQuery, selectedCategory]);

  // Пагинация
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage)

  const getCategoryById = (categoryId: string): BlogCategory | undefined => {
    return categories.find(c => c.id === categoryId);
  };

  // Анимации
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  // 5. Отображаем индикатор загрузки, пока данные не получены
  if (loading && posts.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0"
            animate={{ background: ["radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)", "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)", "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)"] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Sparkles className="w-4 h-4 text-rose-300" />
            <span className="text-sm font-semibold text-rose-200 tracking-wide">Beauty Blog</span>
          </motion.div>
          <motion.h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-rose-500" initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            Блог о красоте
          </motion.h1>
          <motion.p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed font-medium" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            Советы экспертов, последние тренды и секреты красоты от профессионалов индустрии
          </motion.p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <motion.div className="relative flex-1 max-w-md" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Поиск статей..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium" />
            </motion.div>
            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              {allCategories.map((category) => (
                <button key={category.id} onClick={() => { setSelectedCategory(category.id); setCurrentPage(1); setSearchQuery(""); }} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCategory === category.id ? "bg-rose-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"}`}>
                  {category.name}
                  <span className="ml-2 text-xs opacity-75">({category.count})</span>
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === "all" && !searchQuery && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div className="flex items-center gap-3 mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="p-2 bg-rose-600 rounded-xl"><TrendingUp className="w-6 h-6 text-white" /></div>
              <h2 className="text-3xl font-bold text-gray-900">Рекомендуемые статьи</h2>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredPosts.slice(0, 3).map((post, index) => {
                const category = getCategoryById(post.categoryId);
                return (
                  <motion.article key={post.id} className="group relative bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-200" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} whileHover={{ y: -8 }}>
                    <div className="relative h-48 overflow-hidden">
                      <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-4 left-4"><span className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-full">{category?.name}</span></div>
                      <div className="absolute top-4 right-4"><div className="p-2 bg-white/90 rounded-full"><Star className="w-4 h-4 text-rose-600" /></div></div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-rose-600 transition-colors duration-300">{post.title}</h3>
                      <p className="text-gray-600 mb-4 leading-relaxed font-medium">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span className="font-medium">{new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span></div>
                          <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span className="font-medium">{post.readTime} мин</span></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                          Читать <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div className="flex items-center justify-between mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-bold text-gray-900">{searchQuery ? `Результаты поиска: "${searchQuery}"` : selectedCategory === "all" ? "Все статьи" : getCategoryById(selectedCategory)?.name}</h2>
            <div className="text-gray-600 font-medium">Найдено: {filteredPosts.length} статей</div>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" animate="visible">
            {currentPosts.map((post) => {
              const category = getCategoryById(post.categoryId);
              return (
                <motion.article key={post.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-200" variants={itemVariants} whileHover={{ y: -5 }}>
                  <div className="relative h-48 overflow-hidden">
                    <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4"><span className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-full">{category?.name}</span></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-rose-600 transition-colors duration-300 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-3 font-medium">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span className="font-medium">{new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span></div>
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span className="font-medium">{post.readTime} мин</span></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Link href={`/blog/${post.slug}`} className="mt-4 inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                        Читать далее <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div className="flex justify-center items-center gap-2 mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-gray-700">Назад</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 rounded-lg transition-all duration-300 font-semibold ${currentPage === page ? "bg-rose-600 text-white shadow-lg" : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-gray-700">Вперед</button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}