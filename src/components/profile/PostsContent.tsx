// Component for Posts content
"use client";

import Post from "@/components/Post";
import { posts } from "@/data/posts";

export default function PostsContent() {
  return (
    <div className="rounded-xl p-2 sm:p-4">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {posts.map((post) => (
            <Post key={post.id} {...post} />
          ))}
        </div>
        <div className="flex justify-end mt-2">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-4 py-2 sm:px-8 sm:py-3 text-base sm:text-lg transition w-full sm:w-auto">
            Показать больше
          </button>
        </div>
      </div>
    </div>
  );
} 