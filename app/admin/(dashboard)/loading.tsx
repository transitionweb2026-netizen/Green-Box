export default function AdminLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-300/40" />
        <span className="bg-brand-gradient relative h-8 w-8 rounded-full" role="status" aria-label="جارٍ التحميل" />
      </div>
    </div>
  );
}
