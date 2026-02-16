interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "ロード中...",
}) => {
  return (
    <div className="min-h-screen bg-zinc-200 p-4 md:p-10">
      <div className="mx-auto max-w-[1400px] space-y-6 animate-pulse">
        <div className="rounded-md bg-white/70 p-4 md:p-5 border border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="h-7 w-40 rounded bg-gray-300" />
            <div className="h-10 w-28 rounded-md bg-gray-300" />
          </div>
        </div>

        <div className="rounded-md bg-white/60 p-3 md:p-4 border border-gray-200">
          <div className="h-9 w-full rounded bg-gray-300" />
        </div>

        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
          aria-label="ローディング中のプレースホルダー"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="w-full max-w-[356px] rounded-xl border-2 border-gray-300 bg-white/80 overflow-hidden"
            >
              <div className="aspect-[3/1.8] bg-gray-300" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 rounded bg-gray-300" />
                <div className="h-4 w-1/2 rounded bg-gray-300" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 rounded-full bg-gray-300" />
                  <div className="h-8 w-20 rounded-full bg-gray-300" />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
      <p className="mt-6 text-center text-sm text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState;
