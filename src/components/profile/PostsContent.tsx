// Component for Posts content
"use client";

import Post from "@/components/Post";
import { posts } from "@/data/posts";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function PostsContent() {
  const t = useTranslations('publications');
  
  return (
    <div className="flex flex-col gap-2 sm:gap-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 auto-rows-min">
        {posts.map((post, idx) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.08, ease: 'easeOut' }}
            className="break-inside-avoid"
          >
            <Post {...post} />
          </motion.div>
        ))}
      </div>
      <div className="flex justify-end mt-2">
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.97 }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-4 py-2 sm:px-8 sm:py-3 text-base sm:text-lg transition w-full sm:w-auto"
        >
          {t('showMore')}
        </motion.button>
      </div>
    </div>
  );
} 