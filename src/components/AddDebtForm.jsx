"use client";

import { useMemo, useState } from "react";
import { X, Plus, Trash2, Calendar, User, Phone, Clipboard } from "lucide-react";

export default function AddDebtForm({ inventory, customerNames = [], onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState([
    { inventoryId: "", name: "", quantity: 1, price: 0, category: "", costAtSale: 0 }
  ]);

  const [customTotal, setCustomTotal] = useState("");

  const handleAddItemRow = () => {
    setItems([...items, { inventoryId: "", name: "", quantity: 1, price: 0, category: "", costAtSale: 0 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) {
      setItems([{ inventoryId: "", name: "", quantity: 1, price: 0, category: "", costAtSale: 0 }]);
    } else {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === "inventoryId") {
      item.inventoryId = value;
      if (value === "custom") {
        item.name = "";
        item.price = 0;
        item.category = "";
        item.costAtSale = 0;
      } else {
        const selectedInv = inventory.find(inv => inv.id === value);
        if (selectedInv) {
          item.name = selectedInv.name;
          item.price = selectedInv.price || 0;
          item.category = selectedInv.category || "Uncategorized";
          item.costAtSale = selectedInv.cost || 0;
        }
      }
    } else if (field === "name") {
      item.name = value;
    } else if (field === "category") {
      item.category = value;
    } else if (field === "quantity") {
      item.quantity = parseInt(value, 10) || 0;
    } else if (field === "price") {
      item.price = parseFloat(value) || 0;
    } else if (field === "costAtSale") {
      item.costAtSale = parseFloat(value) || 0;
    }

    setItems(newItems);
  };

  const autoSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const finalTotal = customTotal !== "" ? parseFloat(customTotal) || 0 : autoSubtotal;
  const discountAmount = Math.max(0, autoSubtotal - finalTotal);
  const discountPercent = autoSubtotal > 0 ? (discountAmount / autoSubtotal) * 100 : 0;
  const categoryHints = useMemo(() => {
    return Array.from(
      new Set(
        inventory
          .map((item) => item.category)
          .filter((category) => typeof category === "string" && category.trim() !== "")
      )
    );
  }, [inventory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validItems = items
      .filter(item => item.name.trim() !== "")
      .map((item) => {
        const selectedInv = inventory.find((inv) => inv.id === item.inventoryId);
        return {
          ...item,
          category: item.inventoryId === "custom"
            ? item.category || "Uncategorized"
            : selectedInv?.category || "Uncategorized",
          costAtSale: item.inventoryId === "custom"
            ? parseFloat(item.costAtSale) || 0
            : parseFloat(selectedInv?.cost) || 0,
        };
      });

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      date,
      items: validItems,
      amountOwed: finalTotal,
      originalOwed: finalTotal,
      autoSubtotal,
      discountAmount,
      discountPercent,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A1816]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-md bg-brand-paper rounded-t-2xl shadow-2xl z-10 overflow-hidden animate-slide-up flex flex-col max-h-[90vh] border-t border-[#ECE6DD]">
        {/* Tactile drag indicator */}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col">
          {/* Header */}
          <div className="mb-6 shrink-0">
            <h2 className="font-serif font-bold text-2xl text-brand-charcoal">
              Add Debt Record
            </h2>
            <p className="text-xs text-brand-clay font-sans mt-1">
              Log credit taken by a customer. This automatically updates matching inventory levels.
            </p>
          </div>

          <div className="space-y-5 flex-1">
            {/* Customer Name */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Customer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60" />
                <input
                  list="customer-name-suggestions"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-rust font-sans"
                />
                <datalist id="customer-name-suggestions">
                  {customerNames.map((customerName) => (
                    <option key={customerName} value={customerName} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60" />
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-rust font-sans"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Date Taken
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-rust font-sans"
                />
              </div>
            </div>

            {/* Items Taken */}
            <div className="border-t border-[#ECE6DD] pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-brand-clay font-sans">
                  Items Taken
                </h4>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="text-xs text-brand-rust font-semibold hover:underline flex items-center gap-1 font-sans cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => {
                  const selectedInv = inventory.find(inv => inv.id === item.inventoryId);
                  const maxStock = selectedInv ? selectedInv.quantity : 0;
                  const isStockWarning = selectedInv && item.quantity > maxStock;

                  return (
                    <div key={idx} className="bg-brand-cream p-3.5 rounded-xl border border-[#ECE6DD] space-y-2.5">
                      <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                          <select
                            value={item.inventoryId}
                            onChange={(e) => handleItemFieldChange(idx, "inventoryId", e.target.value)}
                            required
                            className="w-full bg-brand-paper text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-2 px-2.5 focus:outline-none focus:border-brand-rust font-sans cursor-pointer"
                          >
                            <option value="" disabled>-- Select Stock Item --</option>
                            {inventory.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} (Stock: {inv.quantity})
                              </option>
                            ))}
                            <option value="custom">-- Custom Item (not in stock) --</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-brand-clay/70 hover:text-red-700 p-1 cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.inventoryId === "custom" && (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Custom Item Name"
                            value={item.name}
                            onChange={(e) => handleItemFieldChange(idx, "name", e.target.value)}
                            required
                            className="w-full bg-brand-paper text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-2 px-2.5 focus:outline-none focus:border-brand-rust font-sans"
                          />
                          <input
                            list="category-hints"
                            type="text"
                            placeholder="Category"
                            value={item.category || ""}
                            onChange={(e) => handleItemFieldChange(idx, "category", e.target.value)}
                            className="w-full bg-brand-paper text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-2 px-2.5 focus:outline-none focus:border-brand-rust font-sans"
                          />
                          <datalist id="category-hints">
                            {categoryHints.map((categoryHint) => (
                              <option key={categoryHint} value={categoryHint} />
                            ))}
                          </datalist>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-brand-clay font-sans block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value)}
                            required
                            className="w-full bg-brand-paper text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-1.5 px-2 focus:outline-none focus:border-brand-rust font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-brand-clay font-sans block mb-0.5">Price/Unit (₵)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.price}
                            onChange={(e) => handleItemFieldChange(idx, "price", e.target.value)}
                            required
                            className="w-full bg-brand-paper text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-1.5 px-2 focus:outline-none focus:border-brand-rust font-sans"
                          />
                        </div>
                        {item.inventoryId === "custom" && (
                          <div>
                            <label className="text-[10px] text-brand-clay font-sans block mb-0.5">Cost/Unit (₵)</label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.costAtSale || ""}
                              onChange={(e) => handleItemFieldChange(idx, "costAtSale", e.target.value)}
                              className="w-full bg-brand-paper text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-1.5 px-2 focus:outline-none focus:border-brand-rust font-sans"
                            />
                          </div>
                        )}
                        <div className="text-right flex flex-col justify-end pb-1.5">
                          <span className="text-[10px] text-brand-clay font-sans block mb-1">Total</span>
                          <span className="text-xs font-serif font-bold text-brand-charcoal pr-1">
                            ₵{(item.quantity * item.price).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {isStockWarning && (
                        <div className="text-[10px] text-brand-rust font-sans italic bg-[#FAF1EE] px-2 py-1 rounded border border-[#F2DDD7]">
                          Only {maxStock} in stock. Deducting {item.quantity} will put stock at {maxStock - item.quantity}.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtotal & Override */}
            <div className="border-t border-[#ECE6DD] pt-4 space-y-3">
              <div className="flex justify-between items-center bg-[#FAF8F5] p-3.5 rounded-xl border border-[#ECE6DD]">
                <span className="text-xs font-semibold text-brand-clay font-sans">
                  Calculated Subtotal
                </span>
                <span className="text-base font-serif font-bold text-brand-charcoal">
                  ₵{autoSubtotal.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                  Final Amount Owed (Override if discounted)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-brand-clay font-sans">₵</span>
                  <input
                    type="number"
                    placeholder={`Keep blank to charge subtotal (₵${autoSubtotal})`}
                    value={customTotal}
                    onChange={(e) => setCustomTotal(e.target.value)}
                    min="0"
                    step="any"
                    className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-7 pr-4 focus:outline-none focus:border-brand-rust font-sans"
                  />
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="text-[11px] text-brand-clay font-sans bg-brand-paper border border-[#ECE6DD] rounded-lg px-3 py-2">
                  <span className="line-through mr-1">₵{autoSubtotal.toLocaleString()}</span>
                  <span className="text-brand-charcoal font-semibold">₵{finalTotal.toLocaleString()}</span>
                  <span className="ml-2 text-brand-rust">Discounted ({discountPercent.toFixed(1)}%)</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Notes
              </label>
              <div className="relative">
                <Clipboard className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60" />
                <textarea
                  placeholder="e.g. Sarah requested packaging, promised to pay by Tuesday."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-rust font-sans resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 shrink-0">
            <button
              type="submit"
              className="w-full bg-brand-charcoal hover:bg-[#2A2622] text-white font-semibold py-3.5 rounded-xl text-xs uppercase tracking-wider font-sans transition-colors cursor-pointer"
            >
              Submit Debt Record (₵{finalTotal.toLocaleString()})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
