"use client";

type BookmarkButtonProps = {
  label: string;
};

export default function BookmarkButton({ label }: BookmarkButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-base text-black shadow-sm backdrop-blur transition hover:bg-white"
    >
      ♡
    </button>
  );
}
