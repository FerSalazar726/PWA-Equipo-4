export function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="loading-skeleton">
      <span className="sr-only">Cargando información de la inspección...</span>
      <div aria-hidden="true" className="skeleton-line skeleton-line-title" />
      <div aria-hidden="true" className="skeleton-line" />
      <div aria-hidden="true" className="skeleton-line" />
      <div aria-hidden="true" className="skeleton-line skeleton-line-short" />
    </div>
  );
}
