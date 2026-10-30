export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      className={className}
    >
      <rect width="48" height="48" rx="14" fill="#102B42" />
      <path
        d="M8 32.5 13.5 14h6.3L24 25.2 28.2 14h6.3L40 32.5h-6.1l-2.8-9.2-4.1 10.1h-6l-4.1-10.1-2.8 9.2H8Z"
        fill="#F36B2B"
      />
      <path d="m13.5 14 10.2 17.4L34.5 14" stroke="#FFB180" strokeWidth="1.4" opacity=".8" />
      <path d="M6 38h36" stroke="white" strokeOpacity=".24" strokeWidth="1.2" />
      <circle cx="37" cy="11" r="4.5" fill="#F36B2B" />
      <path d="m35.2 11 1.2 1.2 2.5-2.6" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandLogo({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark className="size-10 shrink-0 drop-shadow-sm sm:size-11" />
      <span className="min-w-0 leading-none">
        <span className="block whitespace-nowrap text-[15px] font-black tracking-[0.055em] text-[#102b42] sm:text-base">
          MARKASİ
        </span>
        <span className="mt-1 block whitespace-nowrap text-[9px] font-bold tracking-[0.29em] text-[#e65f26]">
          OTOMOTİV
        </span>
        {!compact && (
          <span className="mt-1.5 hidden text-[9px] font-medium tracking-wide text-slate-400 sm:block">
            HER PARÇADA GÜVEN
          </span>
        )}
      </span>
    </span>
  );
}
