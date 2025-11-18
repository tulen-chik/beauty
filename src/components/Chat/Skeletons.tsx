"use client"

export const ChatItemSkeleton = () => (
  <div className="flex items-start gap-4 p-3 mx-2 my-1 animate-pulse">
    <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0"></div>
    <div className="flex-1 min-w-0 mt-1">
      <div className="flex justify-between items-center">
        <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
        <div className="h-3 w-10 bg-gray-200 rounded"></div>
      </div>
      <div className="h-4 w-3/4 bg-gray-200 rounded mt-2"></div>
      <div className="h-5 w-1/3 bg-gray-200 rounded mt-2"></div>
    </div>
  </div>
);

export const ChatViewSkeleton = () => {
  const MessageSkeleton = ({ align }: { align: 'left' | 'right' }) => (
    <div className={`flex items-end gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      {align === 'left' && <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0"></div>}
      <div className="w-2/5 h-12 bg-gray-200 rounded-2xl"></div>
    </div>
  );

  return (
    <main className="flex-1 flex flex-col h-full bg-rose-50 animate-pulse">
      <header className="flex items-center gap-3 p-3 bg-white border-b border-gray-200">
        <div className="w-11 h-11 rounded-full bg-gray-200"></div>
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
          <div className="h-3 w-48 bg-gray-200 rounded mt-1.5"></div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageSkeleton align="left" /> <MessageSkeleton align="right" />
        <MessageSkeleton align="left" /> <MessageSkeleton align="right" />
      </div>
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-full h-11 bg-gray-200 rounded-lg"></div>
          <div className="w-11 h-11 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </main>
  );
};