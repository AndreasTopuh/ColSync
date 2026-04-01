import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8">
          This page doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
