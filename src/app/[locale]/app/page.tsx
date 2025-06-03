"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { usePublication } from "@/contexts/PublicationContext";
import { useAuth } from "@/contexts/AuthContext";

import Post from "@/components/Post";
import ErrorDisplay from "@/components/ErrorDisplay";
import EmptyState from "@/components/EmptyState";

export default function AppHomePage() {
  const t = useTranslations();
  const [post, setPost] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { 
    publications, 
    isLoading, 
    error, 
    getLatestPublications,
    createPublication 
  } = usePublication();

  useEffect(() => {
    getLatestPublications();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = (textareaRef.current.scrollHeight + 5) + 'px';
    }
  }, [post]);

  const handleCreatePost = async () => {
    if (!post.trim() || !user) return;
    
    try {
      await createPublication({
        description: post.trim(),
        user_id: user.id
      });
      setPost(""); // Clear input after successful post
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  return (
    <div className="max-full px-4 sm:px-8 w-full mx-auto flex flex-col gap-4 sm:gap-8 py-4 sm:py-8">
      {/* Post Input */}
      <h2 className="text-[32px] sm:text-[50px] font-bold text-white">{t('publications.createPost')}</h2>
      <div className="bg-black-02 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
        <div className="flex gap-2 sm:gap-3 flex-col items-start">
          <div className="flex-1 flex w-full">
            <Image
              src="/images/cat.jpg"
              alt="avatar"
              width={32}
              height={32}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            />
            <textarea
              ref={textareaRef}
              className="rounded-xl text-white px-3 sm:px-4 py-2 text-sm sm:text-base outline-none bg-black-02 border border-black-02 transition resize-none min-h-[50px] w-full pl-2 sm:pl-3"
              placeholder={t('publications.whatsNew')}
              value={post}
              onChange={e => setPost(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-3 sm:gap-2 text-gray-400">
            <div className="flex gap-2">
              <button className="hover:text-white transition p-1" title="GIF">
                <span role="img" aria-label="gif"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.6504 23.8501L12.751 21.7495C14.2312 20.2693 14.9717 19.5291 15.7734 19.4614C16.177 19.4274 16.5823 19.5055 16.9443 19.687C17.6634 20.0477 18.0759 21.0094 18.9004 22.9331L18.959 23.0708C19.3176 23.9076 19.4977 24.3255 19.793 24.5083C20.0224 24.6503 20.2958 24.7034 20.5615 24.6567C20.9035 24.5967 21.2255 24.275 21.8691 23.6313L21.9941 23.5063C22.7874 22.7131 23.184 22.3161 23.6338 22.1489C24.1282 21.9652 24.6725 21.9652 25.167 22.1489C25.5043 22.2743 25.812 22.5288 26.2793 22.9829L26.8066 23.5063L27.6338 24.3335C28.3808 25.0804 29.3939 25.5004 30.4502 25.5005V11.4087C30.9997 12.7305 31 14.6779 31 17.8003V22.1997C31 26.3481 30.9997 28.4227 29.7109 29.7114C28.4222 30.9999 26.3482 31.0005 22.2002 31.0005H17.7998C13.6518 31.0005 11.5778 30.9999 10.2891 29.7114C9.00033 28.4227 9 26.3481 9 22.1997V17.8003C9 13.6519 9.00033 11.5773 10.2891 10.2886C10.4031 10.1746 10.5232 10.0708 10.6504 9.97607V23.8501Z" fill="white"/>
                <path d="M17.7998 10.0996H22.2002C24.3054 10.0996 25.774 10.102 26.8818 10.251C27.9578 10.3957 28.5277 10.6605 28.9336 11.0664C29.3395 11.4723 29.6043 12.0422 29.749 13.1182C29.898 14.226 29.9004 15.6946 29.9004 17.7998V22.2002C29.9004 24.3054 29.898 25.774 29.749 26.8818C29.6043 27.9578 29.3395 28.5277 28.9336 28.9336C28.5277 29.3395 27.9578 29.6043 26.8818 29.749C25.774 29.898 24.3054 29.9004 22.2002 29.9004H17.7998C15.6946 29.9004 14.226 29.898 13.1182 29.749C12.0422 29.6043 11.4723 29.3395 11.0664 28.9336C10.6605 28.5277 10.3957 27.9578 10.251 26.8818C10.102 25.774 10.0996 24.3054 10.0996 22.2002V17.7998C10.0996 15.6946 10.102 14.226 10.251 13.1182C10.3957 12.0422 10.6605 11.4723 11.0664 11.0664C11.4723 10.6605 12.0422 10.3957 13.1182 10.251C14.226 10.102 15.6946 10.0996 17.7998 10.0996Z" stroke="white" stroke-width="2.2"/>
                <circle cx="23.2996" cy="16.7" r="2.2" fill="white"/>
                </svg>
                </span>
              </button>
              <button className="hover:text-white transition p-1" title="Emoji">
                <span role="img" aria-label="emoji"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25.38 9H21.9673H20.0281H14.6206C11.5213 9 9 11.5214 9 14.6205V25.3797C9 28.4786 11.5213 31 14.6206 31H25.38C28.4787 31 31 28.4786 31 25.3797V19.749V17.7775V14.6205C31 11.5214 28.4787 9 25.38 9ZM18.4693 27.1542C18.2473 27.3691 17.9255 27.5583 17.5042 27.7218C17.0829 27.8853 16.6561 27.967 16.2242 27.967C15.675 27.967 15.1967 27.8519 14.7884 27.6216C14.3803 27.3911 14.0735 27.0617 13.8681 26.6333C13.6628 26.2048 13.5602 25.7387 13.5602 25.2351C13.5602 24.6885 13.6747 24.2027 13.9039 23.7778C14.1331 23.353 14.4685 23.0272 14.9102 22.8002C15.2468 22.6261 15.6655 22.5389 16.1669 22.5389C16.8185 22.5389 17.3275 22.6755 17.6939 22.9488C18.0606 23.2222 18.296 23.6 18.401 24.0821L17.3485 24.279C17.2746 24.0212 17.1353 23.8177 16.9313 23.6686C16.7272 23.5194 16.4725 23.4448 16.1669 23.4448C15.7036 23.4448 15.3356 23.5916 15.0623 23.8852C14.7891 24.1788 14.6524 24.6144 14.6524 25.1921C14.6524 25.8151 14.7908 26.2824 15.0677 26.5938C15.3445 26.9054 15.7074 27.0612 16.1563 27.0612C16.3783 27.0612 16.6008 27.0176 16.8239 26.9304C17.0471 26.8433 17.2387 26.7377 17.3985 26.6136V25.9476H16.1849V25.0632H18.4693V27.1542ZM20.4743 27.8775H19.4145V22.6284H20.4743V27.8775ZM25.0895 23.5164H22.5511V24.7588H24.7424V25.6468H22.5511V27.8775H21.4913V22.6284H25.0895V23.5164ZM29.3942 18.7729C28.6308 19.0999 27.7907 19.2815 26.9091 19.2815C23.4185 19.2815 20.5787 16.4417 20.5787 12.9512C20.5787 12.1229 20.739 11.3315 21.0295 10.6058H25.38C27.5933 10.6058 29.3942 12.4068 29.3942 14.6205V18.7729Z" fill="white"/>
                </svg>
                </span>
              </button>
              <button className="hover:text-white transition p-1" title="Attach">
                <span role="img" aria-label="attach"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 8C26.6271 8.00015 31.999 13.3728 31.999 20C31.9989 26.6271 26.6271 31.9989 20 31.999C13.3728 31.999 8.00015 26.6271 8 20C8 13.3727 13.3727 8 20 8ZM23.9443 20.3682C23.5141 20.1898 23.0241 20.3701 22.8076 20.7715L22.7686 20.8545C22.6182 21.2168 22.3972 21.5467 22.1191 21.8242L21.9014 22.0215C21.6742 22.2074 21.42 22.359 21.1475 22.4717L20.8701 22.5713C20.5886 22.6565 20.2953 22.6992 20 22.6992C19.6062 22.6992 19.2162 22.622 18.8525 22.4717L18.5859 22.3467C18.3266 22.2083 18.0885 22.0323 17.8799 21.8242L17.6826 21.6064C17.5583 21.4553 17.4488 21.2924 17.3564 21.1201L17.2314 20.8545L17.1914 20.7715C16.9748 20.3702 16.485 20.1896 16.0547 20.3682C15.6244 20.5468 15.4059 21.0213 15.5371 21.458L15.5684 21.5449L15.6641 21.7598C15.8658 22.1854 16.1295 22.579 16.4463 22.9277L16.6084 23.0977C16.9982 23.4866 17.4522 23.8054 17.9492 24.04L18.165 24.1357C18.7467 24.3761 19.3705 24.5 20 24.5C20.5508 24.5 21.0967 24.4044 21.6143 24.2197L21.835 24.1357C22.3438 23.9254 22.8122 23.6291 23.2197 23.2607L23.3906 23.0977C23.7803 22.7088 24.0997 22.256 24.335 21.7598L24.4307 21.5449C24.6211 21.0859 24.4033 20.5587 23.9443 20.3682ZM12.7998 16.3994C11.8058 16.3995 11 17.2061 11 18.2002C11.0002 19.1941 11.8059 19.9999 12.7998 20C13.7938 20 14.5994 19.1941 14.5996 18.2002C14.5996 17.2061 13.7939 16.3994 12.7998 16.3994ZM27.1992 16.3994C26.2053 16.3996 25.3994 17.2062 25.3994 18.2002C25.3996 19.194 26.2054 19.9999 27.1992 20C28.1932 20 28.9988 19.1941 28.999 18.2002C28.999 17.2061 28.1933 16.3994 27.1992 16.3994Z" fill="white"/>
                </svg>
                </span>
              </button>
            </div>
            <button
              className="bg-gradient-to-r from-[#FF4400] to-[#FF883D] text-white font-semibold px-4 sm:px-6 py-2 rounded-xl w-full sm:w-[155px] hover:opacity-90 transition"
              disabled={!post.trim()}
              onClick={handleCreatePost}
            >
              {t('publications.post')}
            </button>
          </div>
        </div>
      </div>
      <hr className="border-black-03 border-t-2"></hr>
      
      {/* Activity Feed */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <h2 className="text-[32px] sm:text-[50px] font-bold text-white">{t('publications.activityFeed')}</h2>
          <select className="bg-black-02 w-full sm:w-[50%] text-white h-[40px] sm:h-[50px] px-3 py-1 rounded-xl border border-black-03">
            <option>{t('publications.all')}</option>
            <option>{t('publications.myPosts')}</option>
          </select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-white text-center py-4">
            {t('publications.loading')}
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorDisplay error={error} />
        )}

        {/* Posts List */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {publications.map((publication) => (
            <Post 
              key={publication.id} 
              id={publication.id}
              author={{
                name: "User", // TODO: Get user name from user data
                avatar: "/images/cat.jpg" // TODO: Get user avatar from user data
              }}
              content={publication.description}
              timestamp={new Date(publication.published_at).toLocaleString()}
              likes={0} // TODO: Implement likes functionality
              comments={publication.comments.length}
              shares={0} // TODO: Implement shares functionality
            />
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && !error && publications.length === 0 && (
          <EmptyState text={t('publications.noPosts')} />
        )}
      </div>
    </div>
  );
}
