/**
 * components/LoadingSpinner.jsx
 */
export function LoadingSpinner({ size = "md", message = "" }) {
  const sizes = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizes[size]} rounded-full border-2 border-cyber-border border-t-cyber-cyan animate-spin`} />
      {message && <p className="text-sm text-cyber-muted font-body">{message}</p>}
    </div>
  );
}

/**
 * components/PageLoader.jsx — full-screen loading state
 */
export function PageLoader({ message = "Loading…" }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cyber-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 rounded-full border-cyber-border border-t-cyber-cyan animate-spin" />
        <p className="text-sm text-cyber-muted font-body">{message}</p>
      </div>
    </div>
  );
}