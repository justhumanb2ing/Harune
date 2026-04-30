type GridToolbarProps = {
  onAddItem: () => void;
};

export function GridToolbar({ onAddItem }: GridToolbarProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="font-medium text-sm text-stone-950">Responsive grid</p>
      <button
        className="rounded-full bg-stone-950 px-3 py-1.5 font-medium text-white text-xs"
        onClick={onAddItem}
        type="button"
      >
        Add item
      </button>
    </div>
  );
}
