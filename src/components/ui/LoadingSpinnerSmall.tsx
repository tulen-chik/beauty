import { Loader2 } from "lucide-react";

export const LoadingSpinnerSmall = () => (
    <div className="flex justify-center items-center max-h-screen bg-white">
      <div className="text-center text-gray-500">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-rose-500" />
      </div>
    </div>
  );