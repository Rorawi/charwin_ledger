"use client";

import { useState } from "react";
import { X, Calendar, FileText, Wallet } from "lucide-react";

export default function ExpenseSheet({ onClose, onSubmit }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!description.trim() || Number.isNaN(parsed) || parsed <= 0) return;

    onSubmit({
      description: description.trim(),
      amount: parsed,
      category: category.trim(),
      date,
    });

    setDescription("");
    setAmount("");
    setCategory("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-[#1A1816]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-brand-paper rounded-t-2xl shadow-2xl z-10 overflow-hidden animate-slide-up flex flex-col max-h-[90vh] border-t border-[#ECE6DD]">
        <div className="w-full flex justify-center py-3 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-[#E6E1DA]" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-3 p-1.5 rounded-full hover:bg-brand-cream text-brand-clay transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col">
          <div className="mb-6 shrink-0">
            <h2 className="font-serif font-bold text-2xl text-brand-charcoal">Log Business Expense</h2>
            <p className="text-xs text-brand-clay font-sans mt-1">
              Record transport, packaging, rent, airtime, repairs, and other overheads.
            </p>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Description *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60" />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Delivery transport to market"
                  required
                  className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-rust font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Amount *
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60" />
                <span className="absolute left-9 top-2.5 text-sm text-brand-clay font-sans">₵</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 pl-14 pr-4 focus:outline-none focus:border-brand-rust font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Category / Reason
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Transport, Airtime, Packaging"
                className="w-full bg-brand-cream text-sm text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2.5 px-4 focus:outline-none focus:border-brand-rust font-sans"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-brand-clay block mb-1.5 font-sans">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-brand-clay/60 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
