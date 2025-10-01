"use client"

import { motion } from "framer-motion"
import { ArrowRight,Calendar, Clock, Heart, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface BlogCardProps {
  post: {
    id: string
    title: string
    excerpt: string
    author: {
      name: string
      avatar: string
      role: string
    }
    publishedAt: string
    readTime: number
    category: string
    image: string
    likes: number
    comments: number
  }
  categoryColor: string
  categoryName: string
}

export function BlogCard({ post, categoryColor, categoryName }: BlogCardProps) {
  return (
    <motion.article
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100"
      whileHover={{ y: -5 }}
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={post.image || "/placeholder.svg"}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 bg-gradient-to-r from-${categoryColor}-500 to-${categoryColor}-600 text-white text-xs font-medium rounded-full`}
          >
            {categoryName}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-rose-600 transition-colors duration-300 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-slate-600 mb-4 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString("ru-RU")}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime} мин
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={post.author.avatar || "/placeholder.svg"}
              alt={post.author.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="font-medium text-slate-700 text-xs">{post.author.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {post.likes}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {post.comments}
            </div>
          </div>
        </div>

        <Link
          href={`/blog/${post.id}`}
          className="mt-4 inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm group-hover:gap-3 transition-all duration-300"
        >
          Читать далее
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.article>
  )
}
