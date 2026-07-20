"use client";

import { useMemo, useState } from "react";
import {
  X,
  Phone,
  DollarSign,
  Calendar,
  Trash2,
  CheckCircle,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";

export default function DebtDetailSheet({ debt, onClose, onAddPayment, onSettle, onDelete, formatCurrency }) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [targetTransactionId, setTargetTransactionId] = useState("total");
  const [paymentType, setPaymentType] = useState("payment");

  const currency = formatCurrency || ((amount) => `₵${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(amount)}`);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const purchases = debt?.purchases || [];

  const fullHistory = useMemo(() => {
    if (debt?.fullHistory) return debt.fullHistory;
    const payments = debt?.payments || [];
    return [
      ...purchases.map((purchase) => ({
        id: `purchase-${purchase.id}`,
        kind: "purchase",
        date: purchase.date,
        purchase,
      })),
      ...payments.map((payment) => ({
        id: `payment-${payment.id}`,
        kind: payment.type,
        date: payment.date,
        payment,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debt, purchases]);

  const activeTransactions = useMemo(
    () => purchases.filter((purchase) => purchase.remainingAmount > 0),
    [purchases]
  );

  const totalInvoiced = purchases.reduce((sum, purchase) => sum + purchase.finalAmount, 0);
  const totalPaid = purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
  const isSettled = debt?.status === "settled";

  const maxAllowed = useMemo(() => {
    if (targetTransactionId === "total") return debt.amountOwed;
    const target = purchases.find((purchase) => purchase.id === targetTransactionId);
    return target ? target.remainingAmount : debt?.amountOwed || 0;
  }, [debt, purchases, targetTransactionId]);

  if (!debt) return null;

  const handlePaymentSubmit = (event) => {
    event.preventDefault();
    const parsedAmount = parseFloat(paymentAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddPayment(
      debt.id,
      Math.min(parsedAmount, maxAllowed),
      paymentNote,
      targetTransactionId === "total" ? null : targetTransactionId,
      paymentType
    );

    setPaymentAmount("");
    setPaymentNote("");
    setShowPaymentForm(false);
    setTargetTransactionId("total");
    setPaymentType("payment");
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

        <div className="px-6 pb-8 overflow-y-auto flex-1">
          <div className="mb-6">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-rust font-sans block mb-1">
              {isSettled ? "Settled Profile" : "Customer Profile"}
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

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-brand-cream p-4 rounded-xl border border-[#ECE6DD]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-clay block mb-1">
                Outstanding
              </span>
              <span className="text-lg font-serif font-bold text-brand-charcoal">
                {currency(debt.amountOwed)}
              </span>
            </div>
            <div className="bg-brand-cream p-4 rounded-xl border border-[#ECE6DD]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-clay block mb-1">
                Invoiced
              </span>
              <span className="text-lg font-serif font-semibold text-brand-clay">
                {currency(totalInvoiced)}
              </span>
            </div>
            <div className="bg-brand-cream p-4 rounded-xl border border-[#ECE6DD]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-clay block mb-1">
                Collected
              </span>
              <span className="text-lg font-serif font-semibold text-brand-sage">
                {currency(totalPaid)}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="border-t border-[#ECE6DD] pt-4">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-brand-clay mb-2 font-sans">
                Purchase History
              </h4>
              {(purchases || []).length > 0 ? (
                <div className="space-y-3">
                  {(purchases || []).map((purchase) => (
                    <div key={purchase.id} className="bg-brand-cream p-3.5 rounded-xl border border-[#ECE6DD]">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-brand-charcoal font-sans">
                            {new Date(purchase.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[11px] text-brand-clay font-sans capitalize">
                            {purchase.status === "paid"
                              ? "Paid"
                              : purchase.status === "partial"
                                ? "Partially paid"
                                : "Unpaid"}
                          </p>
                        </div>
                        <div className="text-right">
                          {purchase.discountAmount > 0 ? (
                            <div className="text-xs font-sans">
                              <span className="text-brand-clay line-through mr-1">
                                {currency(purchase.autoSubtotal)}
                              </span>
                              <span className="text-brand-charcoal font-semibold">
                                {currency(purchase.finalAmount)}
                              </span>
                              <span className="block text-[10px] text-brand-clay mt-0.5">
                                Discounted ({purchase.discountPercent.toFixed(1)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-serif font-semibold text-brand-charcoal">
                              {currency(purchase.finalAmount)}
                            </span>
                          )}
                          {purchase.remainingAmount > 0 && (
                            <p className="text-[10px] text-brand-rust mt-1">
                              Remaining {currency(purchase.remainingAmount)}
                            </p>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-1.5">
                        {(purchase.items || []).map((item, index) => (
                          <li
                            key={`${purchase.id}-${index}`}
                            className="flex justify-between items-center text-xs text-brand-charcoal font-sans"
                          >
                            <span>
                              {item.quantity}x {item.name}
                              <span className="text-brand-clay ml-1">({item.category || "Uncategorized"})</span>
                            </span>
                            <span>{currency((item.quantity || 0) * (item.price || 0))}</span>
                          </li>
                        ))}
                      </ul>

                      {typeof purchase.notes === "string" && purchase.notes.trim() !== "" && (
                        <p className="text-[11px] text-brand-clay font-sans italic mt-2">&ldquo;{purchase.notes}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-sans text-brand-charcoal">No purchases found.</p>
              )}
            </div>

            {(fullHistory || []).length > 0 && (
              <div className="border-t border-[#ECE6DD] pt-4">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-brand-clay mb-2.5 font-sans">
                  Running History
                </h4>
                <div className="space-y-2">
                  {(fullHistory || []).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex justify-between items-start text-xs bg-brand-cream/60 p-3 rounded-lg border border-[#F2ECE4] font-sans"
                    >
                      {entry.kind === "purchase" ? (
                        <>
                          <div>
                            <span className="font-semibold text-brand-charcoal">
                              Purchase • {currency(entry.purchase.finalAmount)}
                            </span>
                            {entry.purchase.discountAmount > 0 && (
                              <p className="text-brand-clay mt-0.5">
                                <span className="line-through mr-1">{currency(entry.purchase.autoSubtotal)}</span>
                                Discounted
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-brand-clay shrink-0 ml-2">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="font-semibold text-brand-charcoal">
                              {entry.kind === "writeoff" ? "Write-off" : "Payment"} • {currency(entry.payment.amount)}
                            </span>
                            {entry.payment.notes && (
                              <p className="text-brand-clay mt-1 italic">&ldquo;{entry.payment.notes}&rdquo;</p>
                            )}
                          </div>
                          <span className="text-[10px] text-brand-clay shrink-0 ml-2">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(purchases || []).length > 0 && (
              <div className="border-t border-[#ECE6DD] pt-4 flex gap-2.5 items-start">
                <Calendar className="w-4 h-4 text-brand-clay mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-brand-clay block font-sans mb-0.5">
                    First Purchase Date
                  </span>
                  <span className="text-sm text-brand-charcoal font-sans">
                    {formatDate((purchases || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date))[0]?.date)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isSettled && (
            <div className="space-y-3 mt-8 pt-4 border-t border-[#ECE6DD]">
              {showPaymentForm ? (
                <form onSubmit={handlePaymentSubmit} className="bg-brand-cream p-4 rounded-xl border border-[#ECE6DD] space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-brand-charcoal font-sans">
                    Record Payment / Write-off
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentType("payment")}
                      className={`text-xs py-2 rounded-lg border font-semibold font-sans cursor-pointer ${
                        paymentType === "payment"
                          ? "bg-brand-paper text-brand-charcoal border-brand-rust"
                          : "text-brand-clay border-[#ECE6DD]"
                      }`}
                    >
                      Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType("writeoff")}
                      className={`text-xs py-2 rounded-lg border font-semibold font-sans cursor-pointer ${
                        paymentType === "writeoff"
                          ? "bg-brand-paper text-brand-charcoal border-brand-rust"
                          : "text-brand-clay border-[#ECE6DD]"
                      }`}
                    >
                      Write-off
                    </button>
                  </div>

                  <select
                    value={targetTransactionId}
                    onChange={(e) => setTargetTransactionId(e.target.value)}
                    className="w-full bg-brand-paper text-xs text-brand-charcoal rounded-lg border border-[#ECE6DD] py-2 px-2.5 focus:outline-none focus:border-brand-rust font-sans cursor-pointer"
                  >
                    <option value="total">Apply to total outstanding</option>
                    {(activeTransactions || []).map((purchase) => (
                      <option key={purchase.id} value={purchase.id}>
                        {new Date(purchase.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • Remaining {currency(purchase.remainingAmount)}
                      </option>
                    ))}
                  </select>

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
                        max={maxAllowed}
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
                    placeholder="Note (optional)"
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
                    <span>Record Entry</span>
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
                    <span>Settle All</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-[#ECE6DD] flex justify-between items-center">
            <span className="text-[10px] text-brand-clay/50 font-sans">
              Customer ID: {debt.id.slice(0, 8)}
            </span>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-700 hover:text-red-800 text-xs font-semibold font-sans flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Profile</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete this profile?"
        message="This customer profile and all linked history will be permanently removed from the ledger."
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
