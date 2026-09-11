export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
