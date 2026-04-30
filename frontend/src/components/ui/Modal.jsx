export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4">
      <div className="w-full max-w-xl rounded-[28px] border border-line bg-canvas shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-muted">
            Tutup
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer ? <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
