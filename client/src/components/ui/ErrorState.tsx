import { AlertCircle } from 'lucide-react';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center bg-black/40 border border-red-500/20 rounded-2xl">
      <div className="w-16 h-16 mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Error Processing Request</h3>
      <p className="text-white/60 max-w-md">{message || "An unexpected error occurred while communicating with the server."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
