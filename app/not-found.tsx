import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="animate-float mb-6">
        <Image
          src="/ghost.svg"
          alt="Page not found"
          width={160}
          height={160}
          className="select-none ghost-float"
          priority
          draggable={false}
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Error 404</p>
      <h1 className="text-2xl font-bold text-on-surface mb-3 max-w-xs leading-tight">
        This page wandered off-chain
      </h1>
      <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed mb-8">
        We couldn't find what you're looking for. It may have moved, or the link might be off.
      </p>

      <Link
        href="/dashboard"
        className="relative h-12 px-10 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #FF8C47 0%, #FF6A00 50%, #E55F00 100%)",
          boxShadow: "0 4px 24px rgba(255,106,0,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
