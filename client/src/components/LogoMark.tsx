/* Luminous Quietude: the Serene glint is a thin, abstract four-directional mark that stays recognizable at every scale. */
export function LogoMark({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none" role="img" aria-label="Serene logo">
      <path d="M20 2.5C21.1 12.6 27.4 18.9 37.5 20C27.4 21.1 21.1 27.4 20 37.5C18.9 27.4 12.6 21.1 2.5 20C12.6 18.9 18.9 12.6 20 2.5Z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M20 13.5L26.5 20L20 26.5L13.5 20L20 13.5Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" opacity=".78" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "wordmark wordmark-compact" : "wordmark"}>
      <LogoMark size={compact ? 24 : 29} />
      <span>Serene</span>
    </span>
  );
}
