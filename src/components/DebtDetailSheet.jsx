"use client";

import { useState } from "react";
import { X, Phone, DollarSign, Calendar, FileText, Trash2, CheckCircle } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

export default function DebtDetailSheet({ debt, onClose, onAddPayment, onSettle, onDelete }) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!debt) return null;

  const formatCurrency = (amount) => {
    return "₵" + new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;
    onAddPayment(debt.id, amt, paymentNote);
    setPaymentAmount("");
    setPaymentNote("");
    setShowPaymentForm(false);
  };

  const originalAmount = debt.originalOwed || debt.amountOwed;
  const isSettled = debt.status === "settled";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-[#1A1816]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-up Container */}
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

        {/* Scrollable Inner Panel */}
        <div className="px-6 pb-8 overflow-y-auto flex-1">
          {/* Header */}
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-rust font-sans block mb-1">
              {isSettled ? "Settled Record" : "Outstanding Debt"}
            </span>
            <h2 className="font-serif font-bold text-2xl text-brand-charcoal pr-8 mb-2 leading-tight">
              {debt.name}
            </h2>
            
            {debt.phone && (
              <a
                href={`tel:${debt.phone}`}
                className="inline-flex items-center gap-1.5 text-sm text-brand-rust font-sans hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{debt.phone}</span>
              </a>
            )}
          </div>

          {/* Balance Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-brand-cream p-4 rounded-xl border border-[#ECE6DD]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-clay block mb-1">
                Outstanding
              </span>
              <span className="text-2xl font-serif font-bold text-brand-charcoal">
                {formatCurrency(debt.amountOwed)}
              </span>
            </div>
            <div className="bg-brand-cream p-4 rounded-xl border border-[#ECE6DD]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-clay block mb-1">
                Original Debt
              </span>
              <span className="text-lg font-serif font-semibold text-brand-clay">
                {formatCurrency(originalAmount)}
              </span>
            </div>
          </div>

          {/* Items & Log Details */}
          <div className="space-y-5">
            <div className="border-t border-[#ECE6DD] pt-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-brand-clay mb-2 font-sans">
                Items Taken
              </h4>
              {debt.items && debt.items.length > 0 ? (
                <ul className="space-y-2">
                  {debt.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm font-sans text-brand-charcoal">
                      <span>
                        {item.quantity}x <span className="font-medium">{item.name}</span>
                      </span>
                      {item.price ? (
                        <span className="text-brand-clay">
                          @ {formatCurrency(item.price)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-sans text-brand-charcoal">
                  {debt.itemsSummary || "Clothing items"}
                </p>
              )}
            </div>

            <div className="border-t border-[#ECE6DD] pt-4 flex gap-2.5 items-start">
              <Calendar className="w-4 h-4 text-brand-clay mt-0.5 shrink-0" />
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-brand-clay block font-sans mb-0.5">
                  Date Logged
                </span>
                <span className="text-sm text-brand-charcoal font-sans">
                  {formatDate(debt.date)}
                </span>
              </div>
            </div>

            {debt.notes && (
              <div className="border-t border-[#ECE6DD] pt-4 flex gap-2.5 items-start">
                <FileText className="w-4 h-4 text-brand-clay mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-brand-clay block font-sans mb-0.5">
                    Notes
                  </span>
                  <p className="text-sm text-brand-charcoal font-sans whitespace-pre-line italic">
                    &ldquo;{debt.notes}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Payment logs history */}
            {debt.payments && debt.payments.length > 0 && (
              <div className="border-t border-[#ECE6DD] pt-4">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-brand-clay mb-2.5 font-sans">
                  Payment History
                </h4>
                <div className="space-y-2">
                  {debt.payments.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start text-xs bg-brand-cream/60 p-3 rounded-lg border border-[#F2ECE4] font-sans"
                    >
                      <div>
                        <span className="font-semibold text-brand-charcoal">
                          Paid {formatCurrency(p.amount)}
                        </span>
                        {p.notes && (
                          <p className="text-brand-clay mt-1 italic">
                            &ldquo;{p.notes}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-brand-clay shrink-0 ml-2">
                        {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Recording / Settling Form */}
          {!isSettled && (
            <div className="space-y-3 mt-8 pt-4 border-t border-[#ECE6DD]">
              {showPaymentForm ? (
                <form onSubmit={handlePaymentSubmit} className="bg-brand-cream p-4 rounded-xl border border-[#ECE6DD] space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-brand-charcoal font-sans">
                    Record Payment Amount
                  </h4>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-brand-clay text-sm font-sans">
                        ₵
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        max={debt.amountOwed}
                        min="1"
                        step="any"
                        required
                        className="w-full bg-brand-paper text-sm text-brand-charcoal rounded-lg border border-[#ECE6DD] py-2.5 pl-7 pr-3 focus:outline-none focus:border-brand-rust font-sans"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-brand-rust hover:bg-brand-rust/95 text-white px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider font-sans transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Payment method / notes (e.g. Cash, Zelle)"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full bg-brand-paper text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-2.5 px-3 focus:outline-none focus:border-brand-rust font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="text-xs text-brand-clay hover:underline block pt-1 font-sans cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(true)}
                    className="flex-1 border border-brand-rust text-brand-rust hover:bg-[#B85A38]/5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider font-sans transition-colors flex justify-center items-center gap-1.5 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Record Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSettle(debt.id);
                      onClose();
                    }}
                    className="flex-1 bg-brand-rust hover:bg-brand-rust/95 text-white py-3 rounded-xl text-xs font-semibold uppercase tracking-wider font-sans transition-colors flex justify-center items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Settle Entirely</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Delete Record Button */}
          <div className="mt-8 pt-4 border-t border-[#ECE6DD] flex justify-between items-center">
            <span className="text-[10px] text-brand-clay/50 font-sans">
              ID: {debt.id.slice(0, 8)}
            </span>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-700 hover:text-red-800 text-xs font-semibold font-sans flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete this record?"
        message="This debt record will be permanently removed from the ledger. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          onDelete(debt.id);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
