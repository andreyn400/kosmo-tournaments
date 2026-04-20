import Link from "next/link";

type LogoProps = {
  onNavigate?: () => void;
};

export function Logo({ onNavigate }: LogoProps) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-2.5"
      aria-label="Kosmo Tournaments — на главную"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white font-bold text-sm">
        К
      </span>
      <span className="text-[13px] font-bold tracking-[0.14em] text-black leading-none">
        KOSMO
      </span>
    </Link>
  );
}
