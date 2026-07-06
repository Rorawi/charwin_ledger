"use client";

import { useState } from "react";
import { X, ArrowUpRight, Package } from "lucide-react";

export default function RestockSheet({ inventory, prefilledItemId, onClose, onSubmit }) {
  const [isNewItem, setIsNewItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(prefilledItemId || "");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCost, setNewItemCost] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newLowThreshold, setNewLowThreshold] = useState("5");
  const [quantityToAdd, setQuantityToAdd] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(quantityToAdd, 10);
    if (isNaN(qty) || qty <= 0) return;

    if (isNewItem) {
      if (!newItemName.trim()) return;
      onSubmit({
        isNew: true,
        name: newItemName.trim(),
        price: parseFloat(newItemPrice) || 0,
        cost: parseFloat(newItemCost) || 0,
        category: newItemCategory.trim() || "Uncategorized",
        lowThreshold: parseInt(newLowThreshold, 10) || 5,
        quantity: qty,
      });
    } else {
      if (!selectedItemId) return;
      onSubmit({
        isNew: false,
        id: selectedItemId,
        quantity: qty,
      });
    }

    setNewItemName("");
    setNewItemPrice("");
    setNewItemCost("");
    setNewItemCategory("");
    setNewLowThreshold("5");
    setQuantityToAdd("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A1816]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-md bg-brand-paper rounded-t-2xl shadow-2xl z-10 overflow-hidden animate-slide-up flex flex-col max-h-[85vh] border-t border-[#ECE6DD]">
        {/* Tactile drag indicator pill */}
        <div className="w-full flex justify-center py-3 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-[#E6E1DA]" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-3 p-1.5 rounded-full hover:bg-brand-cream text-brand-clay transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Form Panel */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 overflow-y-auto flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-6 shrink-0">
            <h2 className="font-serif font-bold text-2xl text-brand-charcoal">
              Restock Inventory
            </h2>
            <p className="text-xs text-brand-clay font-sans mt-1">
              Add quantities received or register a new item in your clothing inventory.
            </p>
          </div>

          <div className="space-y-4 flex-1">
            {/* Toggle Existing vs. New */}
            {!prefilledItemId && (
              <div className="flex bg-brand-cream p-1 rounded-xl border border-[#ECE6DD] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewItem(false)}
                  className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider rounded-lg font-sans transition-all cursor-pointer ${
                    !isNewItem
                      ? "bg-brand-paper text-brand-charcoal shadow-sm border border-[#ECE6DD]"
                      : "text-brand-clay hover:text-brand-charcoal"
                  }`}
                >
                  Existing Item
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewItem(true)}
                  className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider rounded-lg font-sans transition-all cursor-pointer ${
                    isNewItem
                      ? "bg-brand-paper text-brand-charcoal shadow-sm border border-[#ECE6DD]"
                      : "text-brand-clay hover:text-brand-charcoal"
                  }`}
                >
                  Create New Item
                </button>
              </div>
            )}

            {/* Selector */}
            {!isNewItem ? (
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                  Select Clothing Item
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60 pointer-events-none" />
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    disabled={!!prefilledItemId}
                    required
                    className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-rust font-sans cursor-pointer disabled:opacity-85"
                  >
                    <option value="" disabled>-- Select Stock Item --</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Currently {item.quantity} in stock)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Linen Wrap Dress"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                    className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 px-4 focus:outline-none focus:border-brand-rust font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                      Retail Price / Unit (₵)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      min="0"
                      step="any"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 px-4 focus:outline-none focus:border-brand-rust font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                      Cost per Unit (₵)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      min="0"
                      step="any"
                      value={newItemCost}
                      onChange={(e) => setNewItemCost(e.target.value)}
                      className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 px-4 focus:outline-none focus:border-brand-rust font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. T-Shirts - Male"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 px-4 focus:outline-none focus:border-brand-rust font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newLowThreshold}
                      onChange={(e) => setNewLowThreshold(e.target.value)}
                      className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 px-4 focus:outline-none focus:border-brand-rust font-sans"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Quantity Received *
              </label>
              <div className="relative">
                <ArrowUpRight className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60 pointer-events-none" />
                <input
                  type="number"
                  placeholder="e.g. 25"
                  min="1"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(e.target.value)}
                  required
                  className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-rust font-sans"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 shrink-0">
            <button
              type="submit"
              className="w-full bg-brand-charcoal hover:bg-[#2A2622] text-white font-semibold py-3.5 rounded-xl text-xs uppercase tracking-wider font-sans transition-colors cursor-pointer"
            >
              Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
