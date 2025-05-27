import Image from "next/image";
import { useState } from "react";

import { CommentProps } from "@/components/Comment";
import Comment from "@/components/Comment";

export interface PostProps {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  commentsList?: CommentProps[];
}

export default function Post({ id, author, content, timestamp, likes, comments, shares, commentsList = [] }: PostProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  return (
    <div className="bg-black-02 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <Image
          src={author.avatar}
          alt="avatar"
          width={32}
          height={32}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
        <div>
          <div className="text-white font-semibold text-sm sm:text-base">{author.name}</div>
          <div className="text-gray-400 text-xs">{timestamp}</div>
        </div>
      </div>
      <div className="text-white text-sm sm:text-base leading-relaxed">
        {content}
      </div>
      <div className="flex items-center gap-4 sm:gap-6 text-gray-400 text-xs sm:text-sm mt-2">
        <button className="flex items-center gap-1 hover:text-accent transition">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          {likes}
        </button>
        <button 
          className={`flex items-center gap-1 hover:text-accent transition ${showComments ? 'text-accent' : ''}`} 
          onClick={() => setShowComments(v => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 22 40" fill="none"><path width="20" height="20" fill="currentcolor" d="M11 9C14.4168 9 16.125 9.00045 17.4727 9.55859C19.2695 10.3029 20.6971 11.7305 21.4414 13.5273C21.9996 14.875 22 16.5832 22 20C22 23.4168 21.9996 25.125 21.4414 26.4727C20.6971 28.2695 19.2695 29.6971 17.4727 30.4414C16.125 30.9996 14.4168 31 11 31H7.33301C3.87626 31 2.14813 30.9997 1.07422 29.9258C0.000310818 28.8519 1.06219e-09 27.1237 0 23.667V20C0 16.5832 0.000447559 14.875 0.558594 13.5273C1.30288 11.7305 2.73047 10.3029 4.52734 9.55859C5.87497 9.00045 7.58324 9 11 9ZM7.33301 21.2217C6.65799 21.2217 6.11035 21.7693 6.11035 22.4443C6.11062 23.1191 6.65816 23.667 7.33301 23.667L11 23.666L11.125 23.6592C11.7411 23.5964 12.2217 23.076 12.2217 22.4434C12.2214 21.8109 11.741 21.2903 11.125 21.2275L11 21.2207L7.33301 21.2217ZM7.33301 16.333C6.65816 16.333 6.11062 16.8799 6.11035 17.5547C6.11035 18.2297 6.65799 18.7783 7.33301 18.7783H14.666L14.791 18.7715C15.4073 18.709 15.8884 18.1884 15.8887 17.5557C15.8887 16.9228 15.4074 16.4023 14.791 16.3398L14.666 16.333H7.33301Z"/></svg>
          {comments}
        </button>
        <button className="flex items-center gap-1 hover:text-accent transition">
          <svg width="20" height="20" fill="none" viewBox="0 0 29 17"> <path fill="currentColor" d="M28.5179 6.45504L19.3703 0.197799C18.6297 -0.308813 17.6194 0.216388 17.6194 1.108V3.71532C9.33367 3.71532 2.33031 9.1363 0.0149204 16.5923C-0.0827743 16.9069 0.322671 17.1409 0.550967 16.9017C3.90874 13.3844 8.66255 11.189 13.935 11.189H17.6194V13.6225C17.6194 14.5141 18.6297 15.0393 19.3703 14.5327L28.5179 8.27545C29.1607 7.83572 29.1607 6.89475 28.5179 6.45504Z"/></svg>
          {shares}
        </button>
      </div>

      {showComments && (
        <div>
          <div className="flex flex-col items-start gap-3 mb-4 sm:mb-6">
            <input
              className="flex-1 bg-black-02 border border-black-03 rounded-xl text-white w-full text-sm sm:text-base outline-none focus:border-accent transition px-3 py-2"
              placeholder="Введите комментарий"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row justify-between w-full gap-3 sm:gap-0">
              <div className="flex gap-2">
                <button className="hover:text-white transition" title="GIF">
                  <span role="img" aria-label="gif"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.6504 23.8501L12.751 21.7495C14.2312 20.2693 14.9717 19.5291 15.7734 19.4614C16.177 19.4274 16.5823 19.5055 16.9443 19.687C17.6634 20.0477 18.0759 21.0094 18.9004 22.9331L18.959 23.0708C19.3176 23.9076 19.4977 24.3255 19.793 24.5083C20.0224 24.6503 20.2958 24.7034 20.5615 24.6567C20.9035 24.5967 21.2255 24.275 21.8691 23.6313L21.9941 23.5063C22.7874 22.7131 23.184 22.3161 23.6338 22.1489C24.1282 21.9652 24.6725 21.9652 25.167 22.1489C25.5043 22.2743 25.812 22.5288 26.2793 22.9829L26.8066 23.5063L27.6338 24.3335C28.3808 25.0804 29.3939 25.5004 30.4502 25.5005V11.4087C30.9997 12.7305 31 14.6779 31 17.8003V22.1997C31 26.3481 30.9997 28.4227 29.7109 29.7114C28.4222 30.9999 26.3482 31.0005 22.2002 31.0005H17.7998C13.6518 31.0005 11.5778 30.9999 10.2891 29.7114C9.00033 28.4227 9 26.3481 9 22.1997V17.8003C9 13.6519 9.00033 11.5773 10.2891 10.2886C10.4031 10.1746 10.5232 10.0708 10.6504 9.97607V23.8501Z" fill="white"/>
                  <path d="M17.7998 10.0996H22.2002C24.3054 10.0996 25.774 10.102 26.8818 10.251C27.9578 10.3957 28.5277 10.6605 28.9336 11.0664C29.3395 11.4723 29.6043 12.0422 29.749 13.1182C29.898 14.226 29.9004 15.6946 29.9004 17.7998V22.2002C29.9004 24.3054 29.898 25.774 29.749 26.8818C29.6043 27.9578 29.3395 28.5277 28.9336 28.9336C28.5277 29.3395 27.9578 29.6043 26.8818 29.749C25.774 29.898 24.3054 29.9004 22.2002 29.9004H17.7998C15.6946 29.9004 14.226 29.898 13.1182 29.749C12.0422 29.6043 11.4723 29.3395 11.0664 28.9336C10.6605 28.5277 10.3957 27.9578 10.251 26.8818C10.102 25.774 10.0996 24.3054 10.0996 22.2002V17.7998C10.0996 15.6946 10.102 14.226 10.251 13.1182C10.3957 12.0422 10.6605 11.4723 11.0664 11.0664C11.4723 10.6605 12.0422 10.3957 13.1182 10.251C14.226 10.102 15.6946 10.0996 17.7998 10.0996Z" stroke="white" stroke-width="2.2"/>
                  <circle cx="23.2996" cy="16.7" r="2.2" fill="white"/>
                  </svg>
                  </span>
                </button>
                <button className="hover:text-white transition" title="Attach">
                  <span role="img" aria-label="attach"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 8C26.6271 8.00015 31.999 13.3728 31.999 20C31.9989 26.6271 26.6271 31.9989 20 31.999C13.3728 31.999 8.00015 26.6271 8 20C8 13.3727 13.3727 8 20 8ZM23.9443 20.3682C23.5141 20.1898 23.0241 20.3701 22.8076 20.7715L22.7686 20.8545C22.6182 21.2168 22.3972 21.5467 22.1191 21.8242L21.9014 22.0215C21.6742 22.2074 21.42 22.359 21.1475 22.4717L20.8701 22.5713C20.5886 22.6565 20.2953 22.6992 20 22.6992C19.6062 22.6992 19.2162 22.622 18.8525 22.4717L18.5859 22.3467C18.3266 22.2083 18.0885 22.0323 17.8799 21.8242L17.6826 21.6064C17.5583 21.4553 17.4488 21.2924 17.3564 21.1201L17.2314 20.8545L17.1914 20.7715C16.9748 20.3702 16.485 20.1896 16.0547 20.3682C15.6244 20.5468 15.4059 21.0213 15.5371 21.458L15.5684 21.5449L15.6641 21.7598C15.8658 22.1854 16.1295 22.579 16.4463 22.9277L16.6084 23.0977C16.9982 23.4866 17.4522 23.8054 17.9492 24.04L18.165 24.1357C18.7467 24.3761 19.3705 24.5 20 24.5C20.5508 24.5 21.0967 24.4044 21.6143 24.2197L21.835 24.1357C22.3438 23.9254 22.8122 23.6291 23.2197 23.2607L23.3906 23.0977C23.7803 22.7088 24.0997 22.256 24.335 21.7598L24.4307 21.5449C24.6211 21.0859 24.4033 20.5587 23.9443 20.3682ZM12.7998 16.3994C11.8058 16.3995 11 17.2061 11 18.2002C11.0002 19.1941 11.8059 19.9999 12.7998 20C13.7938 20 14.5994 19.1941 14.5996 18.2002C14.5996 17.2061 13.7939 16.3994 12.7998 16.3994ZM27.1992 16.3994C26.2053 16.3996 25.3994 17.2062 25.3994 18.2002C25.3996 19.194 26.2054 19.9999 27.1992 20C28.1932 20 28.9988 19.1941 28.999 18.2002C28.999 17.2061 28.1933 16.3994 27.1992 16.3994Z" fill="white"/>
                  </svg>
                  </span>
                </button>
              </div>
              <button 
                className="bg-gradient-to-r from-[#FF4400] to-[#FF883D] text-white font-semibold px-4 sm:px-6 py-2 rounded-xl w-full sm:w-[158px] hover:opacity-90 transition"
                disabled={!commentText.trim()}
              >
                Отправить
              </button>
            </div>
          </div>
          <div className="text-white text-base sm:text-[18px] font-semibold mb-2">Комментарии</div>
          <div className="flex flex-col gap-4 sm:gap-6">
            {commentsList.map((comment) => (
              <Comment key={comment.id} {...comment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 