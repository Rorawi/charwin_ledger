"use client";

import { useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function SummaryView({
  formatCurrency,
  totals,
  categoryBreakdown,
  expenses,
}) {
  const [maskCash, setMaskCash] = useState(true);
  const sortedCategories = [...categoryBreakdown].sort((a, b) => a.name.localeCompare(b.name));

  const displayCash = maskCash ? "••••••" : formatCurrency(totals.cashCollected);

  return (
    <div className="space-y-6 pb-28">
      {/* Cash Position Hero */}
      <section className="bg-gradient-to-br from-brand-charcoal to-[#2A2622] rounded-2xl p-5 text-white space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-white/60 mb-3">
              Cash Position
            </p>
            <div className="flex items-baseline gap-3">
              <p className="font-serif text-5xl font-bold leading-none">
                {displayCash}
              </p>
              <button
                onClick={() => setMaskCash(!maskCash)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={maskCash ? "Show" : "Hide"}
              >
                {maskCash ? (
                  <Eye className="w-5 h-5 text-white/70" />
                ) : (
                  <EyeOff className="w-5 h-5 text-white/70" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/20">
          <p className="text-xs text-white/60 leading-relaxed">
            Total collected from customer payments and settled records.
          </p>
        </div>
      </section>

      {/* Key Metrics Grid */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-brand-paper rounded-xl border border-[#ECE6DD] p-4">
          <p className="text-[10px] uppercase tracking-wider text-brand-clay font-sans mb-1.5">
            Stock Value
          </p>
          <p className="font-serif text-2xl text-brand-charcoal font-bold">
            {formatCurrency(totals.stockValue)}
          </p>
        </div>

        <div className="bg-brand-paper rounded-xl border border-[#ECE6DD] p-4">
          <p className="text-[10px] uppercase tracking-wider text-brand-clay font-sans mb-1.5">
            Open Balance
          </p>
          <p className="font-serif text-2xl text-brand-charcoal font-bold">
            {formatCurrency(totals.openBalance)}
          </p>
        </div>

        <div className={`rounded-xl border p-4 ${
          totals.profit >= 0
            ? "bg-brand-sage/10 border-brand-sage"
            : "bg-brand-rust/10 border-brand-rust"
        }`}>
          <p className="text-[10px] uppercase tracking-wider font-sans mb-1.5" style={{
            color: totals.profit >= 0 ? "#8E9A82" : "#B85A38"
          }}>
            Profit
          </p>
          <p className="font-serif text-2xl font-bold" style={{
            color: totals.profit >= 0 ? "#8E9A82" : "#B85A38"
          }}>
            {formatCurrency(totals.profit)}
          </p>
        </div>

        <div className="bg-brand-rust/10 rounded-xl border border-brand-rust p-4">
          <p className="text-[10px] uppercase tracking-wider text-brand-rust font-sans mb-1.5">
            Loss
          </p>
          <p className="font-serif text-2xl text-brand-rust font-bold">
            {formatCurrency(totals.loss)}
          </p>
        </div>
      </section>

      {/* Category Breakdown */}
      {sortedCategories.length > 0 && (
      <section className="bg-brand-paper rounded-2xl border border-[#ECE6DD] p-5">
        <h3 className="font-serif text-lg text-brand-charcoal mb-3">Category Breakdown</h3>
        <div className="space-y-2">
          {sortedCategories.map((row) => (
            <div
              key={row.name}
              className="bg-brand-cream rounded-xl border border-[#ECE6DD] px-3.5 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-brand-charcoal font-sans">{row.name}</p>
                <p className="text-[11px] text-brand-clay font-sans mt-0.5">
                  {row.unitsSold} sold • {formatCurrency(row.revenue)} revenue
                </p>
              </div>
              <p className="text-sm font-serif text-brand-charcoal">
                {formatCurrency(row.stockValue)}
              </p>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Expenses */}
      {expenses.length > 0 && (
      <section className="bg-brand-paper rounded-2xl border border-[#ECE6DD] p-5">
        <h3 className="font-serif text-lg text-brand-charcoal mb-3">Expenses</h3>
        <div className="space-y-2">
          {expenses.slice(0, 6).map((expense) => (
            <div
              key={expense.id}
              className="flex justify-between items-center bg-brand-cream rounded-xl border border-[#ECE6DD] px-3.5 py-2.5"
            >
              <div>
                <p className="text-sm font-sans text-brand-charcoal">{expense.description}</p>
                <p className="text-[11px] text-brand-clay font-sans">
                  {expense.category || "General"} • {new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <p className="text-sm font-serif text-brand-rust">{formatCurrency(expense.amount)}</p>
            </div>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
