interface Props {
  message?: string;
  progress?: number;
}

export default function LoadingState({ message = 'Carregando dados...', progress }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-orange-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 opacity-30 animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white/60 text-sm">{message}</p>
        {progress !== undefined && (
          <div className="mt-3 w-48 bg-white/10 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
