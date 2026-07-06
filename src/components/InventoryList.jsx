"use client";

import { useMemo, useState } from "react";
import { Trash2, ArrowUpRight } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

export default function InventoryList({ inventory, onRestockClick, onDeleteItem }) {
  const [confirmItem, setConfirmItem] = useState(null); // item to confirm deletion
  const [categoryFilter, setCategoryFilter] = useState("all");

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "";
    return "₵" + new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const categories = useMemo(() => {
    return [
      "all",
      ...Array.from(
        new Set(
          inventory.map((item) => item.category || "Uncategorized")
        )
      ).sort(),
    ];
  }, [inventory]);

  const groupedInventory = useMemo(() => {
    const filtered = categoryFilter === "all"
      ? inventory
      : inventory.filter((item) => (item.category || "Uncategorized") === categoryFilter);

    return filtered.reduce((groups, item) => {
      const category = item.category || "Uncategorized";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {});
  }, [inventory, categoryFilter]);

  if (!inventory || inventory.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-brand-paper rounded-xl border border-[#ECE6DD]">
        <p className="text-sm text-brand-clay font-sans italic">
          No stock items registered yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 pb-24">
        <div className="bg-brand-paper rounded-xl border border-[#ECE6DD] p-3">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
            Filter by Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-brand-cream text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-2 px-2.5 focus:outline-none focus:border-brand-rust font-sans cursor-pointer"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>

        {Object.entries(groupedInventory).map(([category, categoryItems]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-brand-clay font-sans px-1">
              {category}
            </h3>
            {categoryItems.map((item) => {
              const threshold = Number.isFinite(item.low_stock_threshold)
                ? item.low_stock_threshold
                : 5;
              const isOutOfStock = item.quantity <= 0;
              const isLowStock = item.quantity > 0 && item.quantity <= threshold;

              return (
                <div
                  key={item.id}
                  className="bg-brand-paper p-4 rounded-xl border border-[#ECE6DD] flex justify-between items-center transition-all"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-sans font-semibold text-brand-charcoal text-base truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-brand-clay font-sans">
                      {item.price ? <span>Sell: {formatCurrency(item.price)}</span> : <span>No price</span>}
                      {item.cost ? (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[#E6E1DA]" />
                          <span>Cost: {formatCurrency(item.cost)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs font-semibold font-sans px-2.5 py-1 rounded-full border ${isOutOfStock
                        ? "bg-[#FAF1EE] text-brand-rust border-[#F2DDD7]"
                        : isLowStock
                          ? "bg-[#FAF7EE] text-amber-800 border-[#F2ECD7]"
                          : "bg-[#F0F3EE] text-brand-sage border-[#E0E8DC]"
                        }`}>
                        {isOutOfStock ? "Out of Stock" : `${item.quantity} in stock`}
                      </span>
                      {isLowStock && !isOutOfStock && (
                        <p className="text-[10px] text-brand-clay mt-1">Low threshold: {threshold}</p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onRestockClick(item.id)}
                        className="bg-brand-cream hover:bg-[#ECE6DD] text-brand-charcoal p-2 rounded-lg border border-[#ECE6DD] transition-colors cursor-pointer"
                        title="Restock Item"
                      >
                        <ArrowUpRight className="w-4 h-4 text-brand-rust" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmItem(item)}
                        className="text-brand-clay/40 hover:text-red-700 p-2 transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!confirmItem}
        title="Remove item?"
        message={`"${confirmItem?.name}" will be permanently removed from your inventory.`}
        confirmLabel="Remove"
        onConfirm={() => {
          onDeleteItem(confirmItem.id);
          setConfirmItem(null);
        }}
        onCancel={() => setConfirmItem(null)}
      />
    </>
  );
}
