"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Phone, FileText } from "lucide-react";

export default function SwipeableDebtItem({ debt, onSettle, onTap }) {
  const [translation, setTranslation] = useState(0);
  const [isSwipedOpen, setIsSwipedOpen] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  
  const startX = useRef(0);
  const startY = useRef(0);
  const currentTranslation = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalScroll = useRef(null);
  
  const SWIPE_LIMIT = -90; // pixels to swipe left to reveal action
  const THRESHOLD = -45;

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentTranslation.current = translation;
    isDragging.current = true;
    setIsDraggingState(true);
    isHorizontalScroll.current = null;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startX.current;
    const diffY = touch.clientY - startY.current;

    // Determine if user is scrolling page vertically or swiping row horizontally
    if (isHorizontalScroll.current === null) {
      isHorizontalScroll.current = Math.abs(diffX) > Math.abs(diffY);
    }

    if (!isHorizontalScroll.current) return;

    // If scrolling horizontally, prevent default viewport actions (like swipe back/forward in browser)
    if (e.cancelable) {
      e.preventDefault();
    }

    let target = currentTranslation.current + diffX;
    
    // Clamp to prevent swiping right, and add resistance if swiped past the limit
    if (target > 0) target = 0;
    if (target < SWIPE_LIMIT) {
      const overlimit = target - SWIPE_LIMIT;
      target = SWIPE_LIMIT + overlimit * 0.2; // 80% resistance
    }

    setTranslation(target);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsDraggingState(false);

    if (translation < THRESHOLD) {
      setTranslation(SWIPE_LIMIT);
      setIsSwipedOpen(true);
    } else {
      setTranslation(0);
      setIsSwipedOpen(false);
    }
  };

  const resetSwipe = () => {
    setTranslation(0);
    setIsSwipedOpen(false);
  };

  const formatCurrency = (amount) => {
    return "₵" + new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleCardClick = () => {
    if (isSwipedOpen) {
      resetSwipe();
    } else {
      onTap(debt);
    }
  };

  useEffect(() => {
    if (isSwipedOpen) {
      const handleOutsideEvent = () => resetSwipe();
      document.addEventListener("touchstart", handleOutsideEvent);
      return () => document.removeEventListener("touchstart", handleOutsideEvent);
    }
  }, [isSwipedOpen]);

  const isPartiallyPaid = debt.payments && debt.payments.length > 0;
  const latestPurchase = debt.purchases?.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const purchaseCount = debt.purchases?.length || 0;
  
  return (
    <div className="relative overflow-hidden rounded-xl mb-3 select-none touch-pan-y bg-brand-cream border border-[#ECE6DD]">
      {/* Background Action (Revealed on swipe) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSettle(debt.id);
          resetSwipe();
        }}
        className="absolute right-0 top-0 bottom-0 w-[90px] bg-brand-rust text-white flex flex-col items-center justify-center transition-all active:opacity-90 cursor-pointer"
      >
        <Check className="w-5 h-5 mb-1" />
        <span className="text-[10px] uppercase tracking-wider font-semibold font-sans">Settle</span>
      </button>

      {/* Foreground Interactive Card */}
      <div
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translation}px)`,
          transition: isDraggingState ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="relative bg-brand-paper p-4 flex justify-between items-center cursor-pointer select-none active:bg-[#FAF9F7]"
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-serif font-semibold text-lg text-brand-charcoal truncate">
              {debt.name}
            </h3>
            {debt.phone && (
              <span className="text-brand-clay shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <p className="text-sm text-brand-clay truncate font-sans">
            {latestPurchase
              ? `${purchaseCount} ${purchaseCount === 1 ? "purchase" : "purchases"} • ${latestPurchase.items
                  .slice(0, 2)
                  .map((item) => `${item.quantity}x ${item.name}`)
                  .join(", ")}`
              : "Customer ledger profile"}
          </p>
          {debt.notes && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-brand-clay/80 font-sans italic truncate">
              <FileText className="w-3 h-3" />
              <span>{debt.notes}</span>
            </div>
          )}
        </div>

        <div className="text-right flex flex-col items-end shrink-0">
          <span className="text-[11px] text-brand-clay font-sans uppercase tracking-wider mb-0.5">
            {formatDate(debt.date)}
          </span>
          <span className="text-lg font-serif font-bold text-brand-charcoal">
            {formatCurrency(debt.amountOwed)}
          </span>
          {isPartiallyPaid && (
            <span className="text-[10px] text-brand-rust font-sans mt-1 bg-[#FAF1EE] px-1.5 py-0.5 rounded-full border border-[#F2DDD7]">
              Part Paid
            </span>
          )}
          {latestPurchase?.discountAmount > 0 && (
            <span className="text-[10px] text-brand-clay font-sans mt-1">
              Discounted transaction
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
