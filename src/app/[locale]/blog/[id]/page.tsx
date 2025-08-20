"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, Share2, ArrowLeft, Tag, Copy, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { getPostById, getCategoryById, getRelatedPosts } from "../BlogData"
import BlogContent from "../BlogContent"
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  TelegramIcon,
  WhatsappIcon,
} from "react-share"
import { useState, useEffect } from "react"
import copy from "copy-to-clipboard"

export default function BlogPostPage() {
  const params = useParams()
  const postId = params.id as string

  const post = getPostById(postId)
  const category = post ? getCategoryById(post.categoryId) : null
  const relatedPosts = post ? getRelatedPosts(post.id) : []

  const [currentUrl, setCurrentUrl] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href)
    }
  }, [])

  const handleCopy = () => {
    copy(currentUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000) // Сбросить статус "скопировано" через 2 секунды
  }

  if (!post || !category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Статья не найдена</h1>
          <Link href="/blog" className="text-rose-600 hover:text-rose-700 font-medium">
            Вернуться к блогу
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <motion.div
            className="flex items-center gap-4 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors duration-300 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к блогу
            </Link>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-full mb-6">
              <Tag className="w-4 h-4" />
              <span className="text-sm font-semibold">{category.name}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

            <div className="flex items-center justify-center gap-6 text-gray-600 mb-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{post.readTime} мин чтения</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-xl border border-gray-200">
              <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Main Content */}
              <motion.div
                className="lg:col-span-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <BlogContent content={post.content} />

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Теги:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Share */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Поделиться статьей:</h3>
                    <div className="flex items-center gap-3">
                      <FacebookShareButton url={currentUrl} title={post.title}>
                        <FacebookIcon size={32} round />
                      </FacebookShareButton>
                      <TwitterShareButton url={currentUrl} title={post.title}>
                        <TwitterIcon size={32} round />
                      </TwitterShareButton>
                      <LinkedinShareButton url={currentUrl} title={post.title}>
                        <LinkedinIcon size={32} round />
                      </LinkedinShareButton>
                      <TelegramShareButton url={currentUrl} title={post.title}>
                        <TelegramIcon size={32} round />
                      </TelegramShareButton>
                      <WhatsappShareButton url={currentUrl} title={post.title} separator=":: ">
                        <WhatsappIcon size={32} round />
                      </WhatsappShareButton>
                      <button
                        onClick={handleCopy}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors duration-300"
                        title="Скопировать ссылку"
                      >
                        {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.div
                className="lg:col-span-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-4">Похожие статьи</h4>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => {
                        return (
                          <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`} className="block group">
                            <div className="flex gap-3">
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={relatedPost.image || "/placeholder.svg"}
                                  alt={relatedPost.title}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1">
                                <h5 className="text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors duration-300 line-clamp-2 mb-1">
                                  {relatedPost.title}
                                </h5>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}