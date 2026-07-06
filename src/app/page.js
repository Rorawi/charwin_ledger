"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import SwipeableDebtItem from "../components/SwipeableDebtItem";
import DebtDetailSheet from "../components/DebtDetailSheet";
import AddDebtForm from "../components/AddDebtForm";
import InventoryList from "../components/InventoryList";
import RestockSheet from "../components/RestockSheet";
import ExpenseSheet from "../components/ExpenseSheet";
import SummaryView from "../components/SummaryView";
import {
  Search,
  Plus,
  Layers,
  BookOpen,
  AlertCircle,
  Receipt,
  ScrollText,
  Wallet,
} from "lucide-react";

function toKey(name) {
  return (name || "").trim().toLowerCase();
}

function parsePayments(payments) {
  if (!Array.isArray(payments)) return [];
  return payments.map((payment, index) => ({
    id: payment.id || `pay-${Date.now()}-${index}`,
    amount: Number(payment.amount) || 0,
    date: payment.date || new Date().toISOString(),
    notes: payment.notes || "",
    targetTransactionId: payment.targetTransactionId || null,
    type: payment.type === "writeoff" ? "writeoff" : "payment",
  }));
}

function parsePurchases(row) {
  const raw = Array.isArray(row.items) ? row.items : [];

  if (
    raw.length > 0 &&
    raw.every((entry) => Array.isArray(entry.items) && typeof entry.finalAmount === "number")
  ) {
    return raw.map((entry, index) => ({
      id: entry.id || `tx-${row.id}-${index}`,
      date: entry.date || row.date || new Date().toISOString(),
      notes: entry.notes || "",
      autoSubtotal: Number(entry.autoSubtotal) || Number(entry.finalAmount) || 0,
      finalAmount: Number(entry.finalAmount) || 0,
      discountAmount: Number(entry.discountAmount) || 0,
      discountPercent: Number(entry.discountPercent) || 0,
      items: (entry.items || []).map((item) => ({
        inventoryId: item.inventoryId || "custom",
        name: item.name || "Item",
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        category: item.category || "Uncategorized",
        costAtSale: Number(item.costAtSale) || 0,
      })),
    }));
  }

  if (raw.length > 0) {
    const fallbackSubtotal = raw.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );
    const fallbackFinal = Number(row.original_owed ?? row.amount_owed) || fallbackSubtotal;
    const discountAmount = Math.max(0, fallbackSubtotal - fallbackFinal);

    return [
      {
        id: `tx-${row.id}-legacy`,
        date: row.date || new Date().toISOString(),
        notes: row.notes || "",
        autoSubtotal: fallbackSubtotal,
        finalAmount: fallbackFinal,
        discountAmount,
        discountPercent: fallbackSubtotal > 0 ? (discountAmount / fallbackSubtotal) * 100 : 0,
        items: raw.map((item) => ({
          inventoryId: item.inventoryId || "custom",
          name: item.name || "Item",
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          category: item.category || "Uncategorized",
          costAtSale: Number(item.costAtSale) || 0,
        })),
      },
    ];
  }

  return [];
}

function recalculateProfile(profile) {
  const purchases = [...profile.purchases].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const payments = [...profile.payments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const paymentAllocations = {};
  const writeoffAllocations = {};

  purchases.forEach((purchase) => {
    paymentAllocations[purchase.id] = 0;
    writeoffAllocations[purchase.id] = 0;
  });

  const unallocatedPayments = [];
  const unallocatedWriteoffs = [];

  payments.forEach((payment) => {
    if (payment.targetTransactionId && payment.type === "payment") {
      if (typeof paymentAllocations[payment.targetTransactionId] === "number") {
        paymentAllocations[payment.targetTransactionId] += payment.amount;
      } else {
        unallocatedPayments.push(payment.amount);
      }
      return;
    }

    if (payment.targetTransactionId && payment.type === "writeoff") {
      if (typeof writeoffAllocations[payment.targetTransactionId] === "number") {
        writeoffAllocations[payment.targetTransactionId] += payment.amount;
      } else {
        unallocatedWriteoffs.push(payment.amount);
      }
      return;
    }

    if (payment.type === "writeoff") {
      unallocatedWriteoffs.push(payment.amount);
    } else {
      unallocatedPayments.push(payment.amount);
    }
  });

  const allocateAcrossOldest = (pool, allocations) => {
    let remainingPool = pool.reduce((sum, value) => sum + value, 0);
    for (const purchase of purchases) {
      const due = Math.max(0, purchase.finalAmount - paymentAllocations[purchase.id] - writeoffAllocations[purchase.id]);
      if (remainingPool <= 0 || due <= 0) continue;
      const applied = Math.min(remainingPool, due);
      allocations[purchase.id] += applied;
      remainingPool -= applied;
    }
  };

  allocateAcrossOldest(unallocatedPayments, paymentAllocations);
  allocateAcrossOldest(unallocatedWriteoffs, writeoffAllocations);

  const decoratedPurchases = purchases.map((purchase) => {
    const paidAmount = paymentAllocations[purchase.id] || 0;
    const writtenOffAmount = writeoffAllocations[purchase.id] || 0;
    const settledAmount = paidAmount + writtenOffAmount;
    const remainingAmount = Math.max(0, purchase.finalAmount - settledAmount);

    return {
      ...purchase,
      paidAmount,
      writtenOffAmount,
      remainingAmount,
      status:
        remainingAmount <= 0
          ? "paid"
          : settledAmount > 0
            ? "partial"
            : "unpaid",
    };
  });

  const totalOutstanding = decoratedPurchases.reduce(
    (sum, purchase) => sum + purchase.remainingAmount,
    0
  );

  const cashCollected = payments
    .filter((payment) => payment.type === "payment")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const writtenOffTotal = payments
    .filter((payment) => payment.type === "writeoff")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const fullHistory = [
    ...decoratedPurchases.map((purchase) => ({
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

  return {
    ...profile,
    purchases: decoratedPurchases,
    payments,
    amountOwed: totalOutstanding,
    status: totalOutstanding > 0 ? "active" : "settled",
    cashCollected,
    writtenOffTotal,
    fullHistory,
    lastActivityDate: fullHistory[0]?.date || profile.lastActivityDate || new Date().toISOString(),
  };
}

function profileToDbRow(profile) {
  const latestPurchaseDate = profile.purchases.length
    ? [...profile.purchases].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    : new Date().toISOString();

  const lifetimeInvoiced = profile.purchases.reduce((sum, purchase) => sum + purchase.finalAmount, 0);

  return {
    name: profile.name,
    phone: profile.phone || "",
    date: latestPurchaseDate,
    amount_owed: profile.amountOwed,
    original_owed: lifetimeInvoiced,
    notes: "",
    status: profile.status,
    items: profile.purchases.map((purchase) => ({
      id: purchase.id,
      date: purchase.date,
      notes: purchase.notes || "",
      autoSubtotal: purchase.autoSubtotal,
      finalAmount: purchase.finalAmount,
      discountAmount: purchase.discountAmount,
      discountPercent: purchase.discountPercent,
      items: purchase.items,
    })),
    payments: profile.payments,
  };
}

export default function Home() {
  const [customerProfiles, setCustomerProfiles] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [isDebtsLoaded, setIsDebtsLoaded] = useState(false);
  const [isInventoryLoaded, setIsInventoryLoaded] = useState(false);
  const [isExpensesLoaded, setIsExpensesLoaded] = useState(false);
  const [dbError, setDbError] = useState(null);

  const [activeTab, setActiveTab] = useState("ledger"); // ledger | inventory | expenses | summary
  const [ledgerSubTab, setLedgerSubTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeDetailDebt, setActiveDetailDebt] = useState(null);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [prefilledRestockId, setPrefilledRestockId] = useState(null);

  useEffect(() => {
    async function loadData() {
      const { data: invData, error: invError } = await supabase
        .from("inventory")
        .select("*")
        .order("created_at", { ascending: false });

      if (invError) {
        setDbError(invError.message);
        setIsInventoryLoaded(true);
        setIsDebtsLoaded(true);
        setIsExpensesLoaded(true);
        return;
      }

      setInventory((invData || []).map((item) => ({
        ...item,
        category: item.category || "Uncategorized",
        low_stock_threshold:
          Number.isFinite(item.low_stock_threshold) || typeof item.low_stock_threshold === "number"
            ? item.low_stock_threshold
            : 5,
      })));
      setIsInventoryLoaded(true);

      const { data: debtData, error: debtError } = await supabase
        .from("debts")
        .select("*")
        .order("created_at", { ascending: false });

      if (debtError) {
        setDbError(debtError.message);
        setIsDebtsLoaded(true);
        setIsExpensesLoaded(true);
        return;
      }

      const merged = new Map();
      for (const row of debtData || []) {
        const profileFromRow = recalculateProfile({
          id: row.id,
          name: row.name,
          phone: row.phone,
          purchases: parsePurchases(row),
          payments: parsePayments(row.payments),
          amountOwed: Number(row.amount_owed) || 0,
          status: row.status === "settled" ? "settled" : "active",
        });

        const key = toKey(profileFromRow.name);
        if (!key) continue;

        if (!merged.has(key)) {
          merged.set(key, profileFromRow);
          continue;
        }

        const existing = merged.get(key);
        merged.set(
          key,
          recalculateProfile({
            ...existing,
            phone: existing.phone || profileFromRow.phone,
            purchases: [...existing.purchases, ...profileFromRow.purchases],
            payments: [...existing.payments, ...profileFromRow.payments],
          })
        );
      }

      setCustomerProfiles(
        [...merged.values()].sort(
          (a, b) => new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime()
        )
      );
      setIsDebtsLoaded(true);

      const { data: expData, error: expError } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (expError) {
        // Keep app usable even if expenses table has not been created yet.
        setExpenses([]);
      } else {
        setExpenses(expData || []);
      }
      setIsExpensesLoaded(true);
    }

    loadData();
  }, []);

  const saveProfileToDb = async (profile) => {
    const payload = profileToDbRow(profile);
    await supabase.from("debts").update(payload).eq("id", profile.id);
  };

  const formatCurrency = (amount) => {
    return "₵" + new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  const activeDebts = useMemo(
    () => customerProfiles.filter((profile) => profile.status === "active"),
    [customerProfiles]
  );

  const settledDebts = useMemo(
    () => customerProfiles.filter((profile) => profile.status === "settled"),
    [customerProfiles]
  );

  const customerNameHints = useMemo(
    () => customerProfiles.map((profile) => profile.name).sort((a, b) => a.localeCompare(b)),
    [customerProfiles]
  );

  const totalOutstanding = useMemo(() => {
    return activeDebts.reduce((sum, profile) => sum + profile.amountOwed, 0);
  }, [activeDebts]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((item) => {
      const threshold = Number.isFinite(item.low_stock_threshold) ? item.low_stock_threshold : 5;
      return item.quantity <= threshold;
    }).length;
  }, [inventory]);

  const filteredActiveDebts = useMemo(() => {
    return activeDebts.filter((profile) =>
      profile.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeDebts, searchQuery]);

  const filteredSettledDebts = useMemo(() => {
    return settledDebts.filter((profile) =>
      profile.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [settledDebts, searchQuery]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const blob = `${expense.description || ""} ${expense.category || ""}`.toLowerCase();
      return blob.includes(searchQuery.toLowerCase());
    });
  }, [expenses, searchQuery]);

  const summaryTotals = useMemo(() => {
    const allPurchases = customerProfiles.flatMap((profile) => profile.purchases);

    const soldCost = allPurchases.reduce((total, purchase) => {
      return (
        total +
        purchase.items.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costAtSale) || 0),
          0
        )
      );
    }, 0);

    const stockValue = inventory.reduce((total, item) => {
      return total + (Number(item.quantity) || 0) * (Number(item.cost) || 0);
    }, 0);

    const cashCollected = customerProfiles.reduce(
      (sum, profile) => sum + profile.cashCollected,
      0
    );

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0),
      0
    );

    const openBalance = customerProfiles.reduce(
      (sum, profile) => sum + profile.amountOwed,
      0
    );

    const writtenOffLoss = customerProfiles.reduce(
      (sum, profile) => sum + profile.writtenOffTotal,
      0
    );

    const soldBelowCostLoss = allPurchases.reduce((total, purchase) => {
      const grossLineTotal = purchase.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
        0
      );
      const ratio = grossLineTotal > 0 ? purchase.finalAmount / grossLineTotal : 1;

      return (
        total +
        purchase.items.reduce((sum, item) => {
          const quantity = Number(item.quantity) || 0;
          const cost = Number(item.costAtSale) || 0;
          const price = Number(item.price) || 0;
          const effectiveRevenue = quantity * price * ratio;
          const effectiveCost = quantity * cost;
          return sum + Math.max(0, effectiveCost - effectiveRevenue);
        }, 0)
      );
    }, 0);

    const damagedLostStockLoss = expenses
      .filter((expense) => /damage|damaged|lost|loss/i.test(expense.category || ""))
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

    const profit = cashCollected - soldCost - totalExpenses;
    const loss = writtenOffLoss + soldBelowCostLoss + damagedLostStockLoss;

    return {
      cashCollected,
      stockValue,
      soldCost,
      openBalance,
      profit,
      loss,
      writtenOffLoss,
      soldBelowCostLoss,
      damagedLostStockLoss,
      totalExpenses,
    };
  }, [customerProfiles, inventory, expenses]);

  const categoryBreakdown = useMemo(() => {
    const rows = new Map();

    inventory.forEach((item) => {
      const key = item.category || "Uncategorized";
      if (!rows.has(key)) {
        rows.set(key, { name: key, stockValue: 0, unitsSold: 0, revenue: 0 });
      }
      rows.get(key).stockValue += (Number(item.quantity) || 0) * (Number(item.cost) || 0);
    });

    customerProfiles.forEach((profile) => {
      profile.purchases.forEach((purchase) => {
        const lineTotal = purchase.items.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
          0
        );
        const ratio = lineTotal > 0 ? purchase.finalAmount / lineTotal : 1;

        purchase.items.forEach((item) => {
          const key = item.category || "Uncategorized";
          if (!rows.has(key)) {
            rows.set(key, { name: key, stockValue: 0, unitsSold: 0, revenue: 0 });
          }
          rows.get(key).unitsSold += Number(item.quantity) || 0;
          rows.get(key).revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0) * ratio;
        });
      });
    });

    return [...rows.values()];
  }, [customerProfiles, inventory]);

  const handleAddDebt = async (newRecord) => {
    const purchase = {
      id: `tx-${Date.now()}`,
      date: newRecord.date,
      notes: newRecord.notes,
      autoSubtotal: Number(newRecord.autoSubtotal) || Number(newRecord.amountOwed) || 0,
      finalAmount: Number(newRecord.amountOwed) || 0,
      discountAmount: Number(newRecord.discountAmount) || 0,
      discountPercent: Number(newRecord.discountPercent) || 0,
      items: newRecord.items.map((item) => ({
        ...item,
        category: item.category || "Uncategorized",
        costAtSale: Number(item.costAtSale) || 0,
      })),
    };

    const profileKey = toKey(newRecord.name);
    const existingProfile = customerProfiles.find((profile) => toKey(profile.name) === profileKey);

    setInventory((prevInventory) =>
      prevInventory.map((item) => {
        const saleLine = newRecord.items.find((sale) => sale.inventoryId === item.id);
        if (!saleLine) return item;
        return { ...item, quantity: item.quantity - saleLine.quantity };
      })
    );

    if (existingProfile) {
      const updatedProfile = recalculateProfile({
        ...existingProfile,
        phone: existingProfile.phone || newRecord.phone,
        purchases: [...existingProfile.purchases, purchase],
      });

      setCustomerProfiles((prevProfiles) =>
        prevProfiles
          .map((profile) => (profile.id === existingProfile.id ? updatedProfile : profile))
          .sort(
            (a, b) => new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime()
          )
      );

      await saveProfileToDb(updatedProfile);
    } else {
      const tempId = `temp-${Date.now()}`;
      const optimisticProfile = recalculateProfile({
        id: tempId,
        name: newRecord.name,
        phone: newRecord.phone,
        purchases: [purchase],
        payments: [],
      });

      setCustomerProfiles((prevProfiles) => [optimisticProfile, ...prevProfiles]);

      const { data: dbDebt } = await supabase
        .from("debts")
        .insert(profileToDbRow(optimisticProfile))
        .select()
        .single();

      if (dbDebt) {
        setCustomerProfiles((prevProfiles) =>
          prevProfiles.map((profile) =>
            profile.id === tempId
              ? recalculateProfile({
                  ...optimisticProfile,
                  id: dbDebt.id,
                })
              : profile
          )
        );
      }
    }

    for (const sale of newRecord.items) {
      if (!sale.inventoryId || sale.inventoryId === "custom") continue;
      const current = inventory.find((item) => item.id === sale.inventoryId);
      if (!current) continue;
      await supabase
        .from("inventory")
        .update({ quantity: current.quantity - sale.quantity })
        .eq("id", sale.inventoryId);
    }

    setIsAddDebtOpen(false);
  };

  const handleAddPayment = async (profileId, amount, notes, targetTransactionId, type = "payment") => {
    const payment = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      notes: notes || (type === "writeoff" ? "Written off" : "Payment logged"),
      targetTransactionId: targetTransactionId || null,
      type,
    };

    let updatedProfile;
    setCustomerProfiles((prevProfiles) =>
      prevProfiles.map((profile) => {
        if (profile.id !== profileId) return profile;
        updatedProfile = recalculateProfile({
          ...profile,
          payments: [...profile.payments, payment],
        });
        return updatedProfile;
      })
    );

    setActiveDetailDebt((prev) => (prev && prev.id === profileId ? updatedProfile : prev));

    if (updatedProfile) {
      await saveProfileToDb(updatedProfile);
    }
  };

  const handleSettleDebt = async (profileId) => {
    const profile = customerProfiles.find((entry) => entry.id === profileId);
    if (!profile || profile.amountOwed <= 0) return;
    await handleAddPayment(profileId, profile.amountOwed, "Fully settled", null, "payment");
  };

  const handleDeleteDebt = async (profileId) => {
    setCustomerProfiles((prevProfiles) => prevProfiles.filter((profile) => profile.id !== profileId));
    setActiveDetailDebt(null);
    await supabase.from("debts").delete().eq("id", profileId);
  };

  const handleRestock = async (restockData) => {
    if (restockData.isNew) {
      const tempId = `temp-inv-${Date.now()}`;
      const tempItem = {
        id: tempId,
        name: restockData.name,
        price: restockData.price,
        cost: restockData.cost,
        quantity: restockData.quantity,
        category: restockData.category || "Uncategorized",
        low_stock_threshold: restockData.lowThreshold || 5,
      };

      setInventory((prevInventory) => [tempItem, ...prevInventory]);

      const { data: dbInv } = await supabase
        .from("inventory")
        .insert({
          name: restockData.name,
          price: restockData.price,
          cost: restockData.cost,
          quantity: restockData.quantity,
          category: restockData.category || "Uncategorized",
          low_stock_threshold: restockData.lowThreshold || 5,
        })
        .select()
        .single();

      if (dbInv) {
        setInventory((prevInventory) =>
          prevInventory.map((item) => (item.id === tempId ? dbInv : item))
        );
      }
    } else {
      let newQuantity = 0;
      setInventory((prevInventory) =>
        prevInventory.map((item) => {
          if (item.id !== restockData.id) return item;
          newQuantity = item.quantity + restockData.quantity;
          return { ...item, quantity: newQuantity };
        })
      );

      if (newQuantity > 0) {
        await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("id", restockData.id);
      }
    }

    setPrefilledRestockId(null);
    setIsRestockOpen(false);
  };

  const handleDeleteInventoryItem = async (itemId) => {
    setInventory((prevInventory) => prevInventory.filter((item) => item.id !== itemId));
    await supabase.from("inventory").delete().eq("id", itemId);
  };

  const handleLogExpense = async (expense) => {
    const tempId = `temp-exp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
    };

    setExpenses((prevExpenses) => [optimistic, ...prevExpenses]);
    setIsExpenseOpen(false);

    const { data } = await supabase
      .from("expenses")
      .insert({
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
      })
      .select()
      .single();

    if (data) {
      setExpenses((prevExpenses) =>
        prevExpenses.map((entry) => (entry.id === tempId ? data : entry))
      );
    }
  };

  if (dbError) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#FAF8F5] min-h-screen px-8 text-center">
        <AlertCircle className="w-8 h-8 text-brand-rust mb-3" />
        <p className="font-serif font-bold text-brand-charcoal text-lg mb-1">Database connection failed</p>
        <p className="text-xs text-brand-clay font-sans mb-4 leading-relaxed">{dbError}</p>
        <p className="text-[11px] text-brand-clay/70 font-sans">
          Ensure required tables are available in Supabase: debts, inventory, and expenses.
        </p>
      </div>
    );
  }

  if (!isDebtsLoaded || !isInventoryLoaded || !isExpensesLoaded) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#FAF8F5] min-h-screen">
        <div className="w-6 h-6 border-2 border-brand-rust border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-serif italic text-sm text-brand-clay">Opening ledger...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-[#FAF8F5] min-h-screen flex flex-col shadow-sm border-x border-[#ECE6DD] relative">
      <header className="px-6 pt-10 pb-6 shrink-0 border-b border-[#F2ECE4]">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-charcoal">
          Thread Ledger
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-brand-clay font-sans">
          {activeDebts.length > 0 ? (
            <>
              Tracking {formatCurrency(totalOutstanding)} across {activeDebts.length}{" "}
              {activeDebts.length === 1 ? "active customer" : "active customers"}.{" "}
              {lowStockCount > 0 ? (
                <span>
                  {lowStockCount} inventory {lowStockCount === 1 ? "item is" : "items are"} at low stock.
                </span>
              ) : (
                "Stock levels are stable."
              )}
            </>
          ) : (
            <>No outstanding balances right now. Keep logging activity to maintain your running ledger.</>
          )}
        </p>
      </header>

      <div className="px-6 py-4 bg-brand-paper/50 backdrop-blur-md sticky top-0 z-20 border-b border-[#F2ECE4] space-y-3">

        {activeTab !== "summary" && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-clay/60" />
            <input
              type="text"
              placeholder={
                activeTab === "ledger"
                  ? "Search customers by name..."
                  : activeTab === "inventory"
                    ? "Search inventory by item name..."
                    : "Search expenses..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-cream text-xs text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2 pl-9 pr-4 focus:outline-none focus:border-brand-rust font-sans placeholder-brand-clay/60"
            />
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="flex gap-4 pt-1 justify-start">
            <button
              onClick={() => setLedgerSubTab("active")}
              className={`text-xs uppercase tracking-wider font-semibold font-sans pb-1 relative cursor-pointer ${
                ledgerSubTab === "active"
                  ? "text-brand-charcoal border-b border-brand-rust"
                  : "text-brand-clay hover:text-brand-charcoal"
              }`}
            >
              Active ({activeDebts.length})
            </button>
            <button
              onClick={() => setLedgerSubTab("settled")}
              className={`text-xs uppercase tracking-wider font-semibold font-sans pb-1 relative cursor-pointer ${
                ledgerSubTab === "settled"
                  ? "text-brand-charcoal border-b border-brand-rust"
                  : "text-brand-clay hover:text-brand-charcoal"
              }`}
            >
              Settled ({settledDebts.length})
            </button>
          </div>
        )}
      </div>

      <main className="flex-1 px-6 pt-5 overflow-y-auto pb-40">
        {activeTab === "ledger" ? (
          ledgerSubTab === "active" ? (
            filteredActiveDebts.length > 0 ? (
              <div className="space-y-1 pb-24">
                <span className="text-[10px] text-brand-clay font-sans uppercase tracking-widest block mb-3 italic">
                  Swipe left on a customer row to quick-settle the remaining balance.
                </span>
                {filteredActiveDebts.map((profile) => (
                  <SwipeableDebtItem
                    key={profile.id}
                    debt={profile}
                    onSettle={handleSettleDebt}
                    onTap={setActiveDetailDebt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-brand-paper rounded-xl border border-[#ECE6DD]">
                <p className="text-sm text-brand-clay font-sans italic">
                  {searchQuery ? "No matching customer profiles found." : "No active customer debts."}
                </p>
              </div>
            )
          ) : filteredSettledDebts.length > 0 ? (
            <div className="space-y-3 pb-24">
              {filteredSettledDebts.map((profile) => {
                const latestPurchase = profile.purchases
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                return (
                  <div
                    key={profile.id}
                    onClick={() => setActiveDetailDebt(profile)}
                    className="bg-brand-paper p-4 rounded-xl border border-[#ECE6DD] flex justify-between items-center opacity-75 active:opacity-100 transition-opacity cursor-pointer"
                  >
                    <div className="min-w-0 pr-3">
                      <h3 className="font-serif font-semibold text-base text-brand-charcoal truncate">
                        {profile.name}
                      </h3>
                      {latestPurchase ? (
                        <p className="text-xs text-brand-clay truncate mt-0.5 font-sans">
                          {latestPurchase.items.map((item) => item.name).join(", ")}
                        </p>
                      ) : (
                        <p className="text-xs text-brand-clay truncate mt-0.5 font-sans">No purchases listed</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-brand-clay font-sans uppercase block mb-0.5">
                        Settled
                      </span>
                      <span className="text-base font-serif font-bold text-brand-sage">
                        {formatCurrency(profile.cashCollected)}
                      </span>
                      {latestPurchase?.discountAmount > 0 && (
                        <span className="block text-[10px] text-brand-clay mt-0.5">
                          Discounted
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-brand-paper rounded-xl border border-[#ECE6DD]">
              <p className="text-sm text-brand-clay font-sans italic">
                {searchQuery ? "No matching settled profiles." : "No settled history yet."}
              </p>
            </div>
          )
        ) : null}

        {activeTab === "inventory" && (
          <InventoryList
            inventory={filteredInventory}
            onRestockClick={(id) => {
              setPrefilledRestockId(id);
              setIsRestockOpen(true);
            }}
            onDeleteItem={handleDeleteInventoryItem}
          />
        )}

        {activeTab === "expenses" && (
          filteredExpenses.length > 0 ? (
            <div className="space-y-3 pb-24">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-brand-paper p-4 rounded-xl border border-[#ECE6DD] flex justify-between items-center"
                >
                  <div className="min-w-0 pr-3">
                    <h3 className="font-sans font-semibold text-brand-charcoal text-base truncate">
                      {expense.description}
                    </h3>
                    <p className="text-xs text-brand-clay mt-1 font-sans">
                      {(expense.category || "General") + " • " + new Date(expense.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="font-serif text-lg text-brand-rust">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-brand-paper rounded-xl border border-[#ECE6DD]">
              <p className="text-sm text-brand-clay font-sans italic">
                {searchQuery ? "No matching expenses." : "No expenses logged yet."}
              </p>
            </div>
          )
        )}

        {activeTab === "summary" && (
          <SummaryView
            formatCurrency={formatCurrency}
            totals={summaryTotals}
            categoryBreakdown={categoryBreakdown}
            expenses={expenses}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-brand-paper border-t border-[#F2ECE4] px-3 py-3">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => {
              setActiveTab("ledger");
              setSearchQuery("");
            }}
            className={`py-3 text-[10px] font-semibold uppercase tracking-wider rounded-lg font-sans transition-all flex flex-col justify-center items-center gap-1.5 cursor-pointer ${
              activeTab === "ledger"
                ? "bg-brand-charcoal text-white"
                : "text-brand-clay hover:text-brand-charcoal"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ledger</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("inventory");
              setSearchQuery("");
            }}
            className={`py-3 text-[10px] font-semibold uppercase tracking-wider rounded-lg font-sans transition-all flex flex-col justify-center items-center gap-1.5 cursor-pointer ${
              activeTab === "inventory"
                ? "bg-brand-charcoal text-white"
                : "text-brand-clay hover:text-brand-charcoal"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Stock</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("expenses");
              setSearchQuery("");
            }}
            className={`py-3 text-[10px] font-semibold uppercase tracking-wider rounded-lg font-sans transition-all flex flex-col justify-center items-center gap-1.5 cursor-pointer ${
              activeTab === "expenses"
                ? "bg-brand-charcoal text-white"
                : "text-brand-clay hover:text-brand-charcoal"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Expenses</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("summary");
              setSearchQuery("");
            }}
            className={`py-3 text-[10px] font-semibold uppercase tracking-wider rounded-lg font-sans transition-all flex flex-col justify-center items-center gap-1.5 cursor-pointer ${
              activeTab === "summary"
                ? "bg-brand-charcoal text-white"
                : "text-brand-clay hover:text-brand-charcoal"
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Summary</span>
          </button>
        </div>
      </nav>

      {/* FAB anchors to tab bar */}
      <div className="fixed bottom-[107px] right-0 z-30 max-w-lg w-full flex justify-end px-6 pointer-events-none">
        {activeTab === "ledger" ? (
          <button
            type="button"
            onClick={() => setIsAddDebtOpen(true)}
            className="pointer-events-auto bg-brand-charcoal text-white rounded-full p-4 shadow-xl hover:bg-[#2A2622] transition-colors flex items-center gap-1 cursor-pointer font-sans text-xs uppercase tracking-wider font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add Purchase</span>
          </button>
        ) : activeTab === "inventory" ? (
          <button
            type="button"
            onClick={() => {
              setPrefilledRestockId(null);
              setIsRestockOpen(true);
            }}
            className="pointer-events-auto bg-brand-rust text-white rounded-full p-4 shadow-xl hover:bg-[#A34E2F] transition-colors flex items-center gap-1 cursor-pointer font-sans text-xs uppercase tracking-wider font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Restock</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpenseOpen(true)}
            className="pointer-events-auto bg-brand-charcoal text-white rounded-full p-4 shadow-xl hover:bg-[#2A2622] transition-colors flex items-center gap-1 cursor-pointer font-sans text-xs uppercase tracking-wider font-semibold"
          >
            <Wallet className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        )}
      </div>

      {activeDetailDebt && (
        <DebtDetailSheet
          debt={activeDetailDebt}
          onClose={() => setActiveDetailDebt(null)}
          onAddPayment={handleAddPayment}
          onSettle={handleSettleDebt}
          onDelete={handleDeleteDebt}
          formatCurrency={formatCurrency}
        />
      )}

      {isAddDebtOpen && (
        <AddDebtForm
          inventory={inventory}
          customerNames={customerNameHints}
          onClose={() => setIsAddDebtOpen(false)}
          onSubmit={handleAddDebt}
        />
      )}

      {isRestockOpen && (
        <RestockSheet
          inventory={inventory}
          prefilledItemId={prefilledRestockId}
          onClose={() => {
            setIsRestockOpen(false);
            setPrefilledRestockId(null);
          }}
          onSubmit={handleRestock}
        />
      )}

      {isExpenseOpen && (
        <ExpenseSheet
          onClose={() => setIsExpenseOpen(false)}
          onSubmit={handleLogExpense}
        />
      )}
    </div>
  );
}
