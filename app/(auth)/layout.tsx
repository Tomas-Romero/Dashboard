export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="aurora-bg pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
