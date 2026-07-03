"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";
import SwipeableDebtItem from "../components/SwipeableDebtItem";
import DebtDetailSheet from "../components/DebtDetailSheet";
import AddDebtForm from "../components/AddDebtForm";
import InventoryList from "../components/InventoryList";
import RestockSheet from "../components/RestockSheet";
import { Search, Plus, Layers, BookOpen, AlertCircle } from "lucide-react";

export default function Home() {
  const [debts, setDebts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isDebtsLoaded, setIsDebtsLoaded] = useState(false);
  const [isInventoryLoaded, setIsInventoryLoaded] = useState(false);
  const [dbError, setDbError] = useState(null);

  const [activeTab, setActiveTab] = useState("ledger"); // "ledger" | "inventory"
  const [ledgerSubTab, setLedgerSubTab] = useState("active"); // "active" | "settled"
  const [searchQuery, setSearchQuery] = useState("");

  // Sheet/Drawer overlay visibility states
  const [activeDetailDebt, setActiveDetailDebt] = useState(null);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [prefilledRestockId, setPrefilledRestockId] = useState(null);

  // Fetch data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      // Fetch Inventory
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) {
        console.error('[Supabase] inventory fetch error:', invError);
        setDbError(invError.message);
        setIsInventoryLoaded(true);
        setIsDebtsLoaded(true);
        return;
      }
      if (invData) setInventory(invData);
      setIsInventoryLoaded(true);

      // Fetch Debts
      const { data: debtData, error: debtError } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });

      if (debtError) {
        console.error('[Supabase] debts fetch error:', debtError);
        setDbError(debtError.message);
        setIsDebtsLoaded(true);
        return;
      }
      if (debtData) {
        const mappedDebts = debtData.map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          date: d.date,
          amountOwed: d.amount_owed,
          originalOwed: d.original_owed,
          notes: d.notes,
          status: d.status,
          items: d.items || [],
          payments: d.payments || []
        }));
        setDebts(mappedDebts);
      }
      setIsDebtsLoaded(true);
    }
    loadData();
  }, []);

  // Computations
  const activeDebts = useMemo(() => debts.filter((d) => d.status === "active"), [debts]);
  const settledDebts = useMemo(() => debts.filter((d) => d.status === "settled"), [debts]);

  const totalOutstanding = useMemo(() => {
    return activeDebts.reduce((sum, d) => sum + d.amountOwed, 0);
  }, [activeDebts]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((item) => item.quantity < 5).length;
  }, [inventory]);

  // Filters listings
  const filteredActiveDebts = useMemo(() => {
    return activeDebts.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeDebts, searchQuery]);

  const filteredSettledDebts = useMemo(() => {
    return settledDebts.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [settledDebts, searchQuery]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  // Operations
  const handleAddDebt = async (newRecord) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticRecord = {
      ...newRecord,
      id: tempId,
      status: "active",
      payments: newRecord.payments || [],
    };

    // 1. Deduct Stock Levels (Optimistic UI)
    setInventory((prevInventory) => {
      return prevInventory.map((invItem) => {
        const matchingSale = newRecord.items.find((sale) => sale.inventoryId === invItem.id);
        if (matchingSale) {
          return {
            ...invItem,
            quantity: invItem.quantity - matchingSale.quantity,
          };
        }
        return invItem;
      });
    });

    // 2. Insert Debt Log (Optimistic UI)
    setDebts((prev) => [optimisticRecord, ...prev]);
    setIsAddDebtOpen(false);

    // 3. Supabase DB Insert for Debt
    const { data: dbDebt } = await supabase.from('debts').insert({
      name: newRecord.name,
      phone: newRecord.phone,
      date: newRecord.date,
      amount_owed: newRecord.amountOwed,
      original_owed: newRecord.originalOwed,
      notes: newRecord.notes,
      status: 'active',
      items: newRecord.items,
      payments: newRecord.payments || []
    }).select().single();

    if (dbDebt) {
      const realDebt = {
        id: dbDebt.id,
        name: dbDebt.name,
        phone: dbDebt.phone,
        date: dbDebt.date,
        amountOwed: dbDebt.amount_owed,
        originalOwed: dbDebt.original_owed,
        notes: dbDebt.notes,
        status: dbDebt.status,
        items: dbDebt.items || [],
        payments: dbDebt.payments || []
      };
      setDebts(prev => prev.map(d => d.id === tempId ? realDebt : d));
    }

    // 4. Supabase DB Update for Inventory
    newRecord.items.forEach(async (sale) => {
      if (sale.inventoryId && sale.inventoryId !== 'custom') {
        const currentItem = inventory.find(i => i.id === sale.inventoryId);
        if (currentItem) {
          const newQty = currentItem.quantity - sale.quantity;
          await supabase.from('inventory').update({ quantity: newQty }).eq('id', sale.inventoryId);
        }
      }
    });
  };

  const handleSettleDebt = async (debtId) => {
    let newPayments = [];

    // Optimistic UI Update
    setDebts((prevDebts) => {
      return prevDebts.map((d) => {
        if (d.id === debtId) {
          const remaining = d.amountOwed;
          if (remaining <= 0) return d;
          newPayments = [
            ...d.payments,
            {
              date: new Date().toISOString(),
              amount: remaining,
              notes: "Fully settled",
            },
          ];
          return {
            ...d,
            amountOwed: 0,
            status: "settled",
            payments: newPayments,
          };
        }
        return d;
      });
    });

    // Supabase DB Update
    if (newPayments.length > 0) {
      await supabase.from('debts').update({
        amount_owed: 0,
        status: 'settled',
        payments: newPayments
      }).eq('id', debtId);
    }
  };

  const handleAddPartialPayment = async (debtId, amount, notes) => {
    let newOwed = 0;
    let isFinished = false;
    let newPayments = [];

    // Optimistic UI Update
    setDebts((prevDebts) => {
      return prevDebts.map((d) => {
        if (d.id === debtId) {
          newOwed = Math.max(0, d.amountOwed - amount);
          isFinished = newOwed <= 0;
          newPayments = [
            ...d.payments,
            {
              date: new Date().toISOString(),
              amount,
              notes: notes || "Partial payment logged",
            },
          ];
          return {
            ...d,
            amountOwed: newOwed,
            status: isFinished ? "settled" : "active",
            payments: newPayments,
          };
        }
        return d;
      });
    });

    // Refresh active details sheet if open
    setActiveDetailDebt((prev) => {
      if (!prev || prev.id !== debtId) return prev;
      return {
        ...prev,
        amountOwed: newOwed,
        status: isFinished ? "settled" : "active",
        payments: newPayments,
      };
    });

    // Supabase DB Update
    if (newPayments.length > 0) {
      await supabase.from('debts').update({
        amount_owed: newOwed,
        status: isFinished ? 'settled' : 'active',
        payments: newPayments
      }).eq('id', debtId);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    // Optimistic UI Update
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
    setActiveDetailDebt(null);

    // Supabase DB Delete
    await supabase.from('debts').delete().eq('id', debtId);
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
      };

      // Optimistic UI Update
      setInventory((prev) => [tempItem, ...prev]);
      setPrefilledRestockId(null);
      setIsRestockOpen(false);

      // Supabase DB Insert
      const { data: dbInv } = await supabase.from('inventory').insert({
        name: restockData.name,
        price: restockData.price,
        cost: restockData.cost,
        quantity: restockData.quantity
      }).select().single();

      if (dbInv) {
        setInventory(prev => prev.map(i => i.id === tempId ? dbInv : i));
      }

    } else {
      let newQty = 0;

      // Optimistic UI Update
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id === restockData.id) {
            newQty = item.quantity + restockData.quantity;
            return { ...item, quantity: newQty };
          }
          return item;
        })
      );
      setPrefilledRestockId(null);
      setIsRestockOpen(false);

      // Supabase DB Update
      if (newQty > 0) {
        await supabase.from('inventory').update({ quantity: newQty }).eq('id', restockData.id);
      }
    }
  };

  const handleDeleteInventoryItem = async (itemId) => {
    // Optimistic UI Update
    setInventory((prev) => prev.filter((item) => item.id !== itemId));

    // Supabase DB Delete
    await supabase.from('inventory').delete().eq('id', itemId);
  };

  const formatCurrency = (amount) => {
    return "₵" + new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // DB error screen
  if (dbError) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#FAF8F5] min-h-screen px-8 text-center">
        <AlertCircle className="w-8 h-8 text-brand-rust mb-3" />
        <p className="font-serif font-bold text-brand-charcoal text-lg mb-1">Database connection failed</p>
        <p className="text-xs text-brand-clay font-sans mb-4 leading-relaxed">{dbError}</p>
        <p className="text-[11px] text-brand-clay/70 font-sans">
          Make sure the <code className="bg-brand-cream px-1 rounded">debts</code> and{" "}
          <code className="bg-brand-cream px-1 rounded">inventory</code> tables exist in your Supabase project.
        </p>
      </div>
    );
  }

  // Safe loading spinner
  if (!isDebtsLoaded || !isInventoryLoaded) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#FAF8F5] min-h-screen">
        <div className="w-6 h-6 border-2 border-brand-rust border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-serif italic text-sm text-brand-clay">Opening ledger...</span>
      </div>
    );
  }


  return (
    <div className="w-full max-w-lg mx-auto bg-[#FAF8F5] min-h-screen flex flex-col shadow-sm border-x border-[#ECE6DD] relative">
      {/* Editorial Header */}
      <header className="px-6 pt-10 pb-6 shrink-0 border-b border-[#F2ECE4]">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-brand-charcoal">
          Charwin Ledger
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-brand-clay font-sans">
          {activeDebts.length > 0 ? (
            <>
              Currently tracking{" "}
              <span className="font-serif font-bold text-brand-charcoal">
                {formatCurrency(totalOutstanding)}
              </span>{" "}
              outstanding across{" "}
              <span className="font-serif font-bold text-brand-charcoal">
                {activeDebts.length} {activeDebts.length === 1 ? "client" : "clients"}
              </span>.{" "}
              {lowStockCount > 0 ? (
                <span>
                  There are{" "}
                  <span className="font-semibold text-brand-rust">
                    {lowStockCount} inventory {lowStockCount === 1 ? "item" : "items"}
                  </span>{" "}
                  running low or out of stock.
                </span>
              ) : (
                "Inventory stock levels are healthy."
              )}
            </>
          ) : (
            <>
              No outstanding balances registered.{" "}
              {lowStockCount > 0 ? (
                <span>
                  However,{" "}
                  <span className="font-semibold text-brand-rust">
                    {lowStockCount} {lowStockCount === 1 ? "item is" : "items are"}
                  </span>{" "}
                  running low in inventory.
                </span>
              ) : (
                "All items are fully cataloged."
              )}
            </>
          )}
        </p>
      </header>

      {/* Control Panel: Navigation & Search */}
      <div className="px-6 py-4 bg-brand-paper/50 backdrop-blur-md sticky top-0 z-20 border-b border-[#F2ECE4] space-y-3">
        {/* Main Tab Controls */}
        <div className="flex bg-[#F2ECE4]/70 p-0.75 rounded-xl border border-[#ECE6DD] relative">
          <button
            onClick={() => {
              setActiveTab("ledger");
              setSearchQuery("");
            }}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg font-sans transition-all flex justify-center items-center gap-1.5 cursor-pointer ${activeTab === "ledger"
              ? "bg-brand-paper text-brand-charcoal shadow-xs border border-[#ECE6DD]"
              : "text-brand-clay hover:text-brand-charcoal"
              }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("inventory");
              setSearchQuery("");
            }}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg font-sans transition-all flex justify-center items-center gap-1.5 cursor-pointer ${activeTab === "inventory"
              ? "bg-brand-paper text-brand-charcoal shadow-xs border border-[#ECE6DD]"
              : "text-brand-clay hover:text-brand-charcoal"
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </button>
        </div>

        {/* Search input field */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-clay/60" />
          <input
            type="text"
            placeholder={
              activeTab === "ledger"
                ? "Search ledger by client..."
                : "Search inventory by name..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-cream text-xs text-brand-charcoal rounded-xl border border-[#ECE6DD] py-2 pl-9 pr-4 focus:outline-none focus:border-brand-rust font-sans placeholder-brand-clay/60"
          />
        </div>

        {/* Sub-toggle selector for Ledger View */}
        {activeTab === "ledger" && (
          <div className="flex gap-4 pt-1 justify-start">
            <button
              onClick={() => setLedgerSubTab("active")}
              className={`text-xs uppercase tracking-wider font-semibold font-sans pb-1 relative cursor-pointer ${ledgerSubTab === "active"
                ? "text-brand-charcoal border-b border-brand-rust"
                : "text-brand-clay hover:text-brand-charcoal"
                }`}
            >
              Outstanding ({activeDebts.length})
            </button>
            <button
              onClick={() => setLedgerSubTab("settled")}
              className={`text-xs uppercase tracking-wider font-semibold font-sans pb-1 relative cursor-pointer ${ledgerSubTab === "settled"
                ? "text-brand-charcoal border-b border-brand-rust"
                : "text-brand-clay hover:text-brand-charcoal"
                }`}
            >
              Settled History ({settledDebts.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Lists Container */}
      <main className="flex-1 px-6 pt-5 overflow-y-auto">
        {activeTab === "ledger" ? (
          /* Ledger Mode */
          ledgerSubTab === "active" ? (
            /* Active Debts */
            filteredActiveDebts.length > 0 ? (
              <div className="space-y-1 pb-24">
                <span className="text-[10px] text-brand-clay font-sans uppercase tracking-widest block mb-3 italic">
                  Tip: Swipe left on a row to quick-settle
                </span>
                {filteredActiveDebts.map((debt) => (
                  <SwipeableDebtItem
                    key={debt.id}
                    debt={debt}
                    onSettle={handleSettleDebt}
                    onTap={setActiveDetailDebt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-brand-paper rounded-xl border border-[#ECE6DD]">
                <p className="text-sm text-brand-clay font-sans italic">
                  {searchQuery ? "No matching records found." : "No outstanding client records."}
                </p>
              </div>
            )
          ) : (
            /* Settled Debts */
            filteredSettledDebts.length > 0 ? (
              <div className="space-y-3 pb-24">
                {filteredSettledDebts.map((debt) => (
                  <div
                    key={debt.id}
                    onClick={() => setActiveDetailDebt(debt)}
                    className="bg-brand-paper p-4 rounded-xl border border-[#ECE6DD] flex justify-between items-center opacity-75 active:opacity-100 transition-opacity cursor-pointer"
                  >
                    <div>
                      <h3 className="font-serif font-semibold text-base text-brand-charcoal truncate">
                        {debt.name}
                      </h3>
                      <p className="text-xs text-brand-clay truncate mt-0.5 font-sans">
                        {debt.itemsSummary || (debt.items && debt.items.map(i => i.name).join(", "))}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-brand-clay font-sans uppercase block mb-0.5">
                        Settled
                      </span>
                      <span className="text-base font-serif font-bold text-brand-sage line-through">
                        {formatCurrency(debt.originalOwed || debt.amountOwed)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-brand-paper rounded-xl border border-[#ECE6DD]">
                <p className="text-sm text-brand-clay font-sans italic">
                  {searchQuery ? "No matching settled logs." : "No settled history yet."}
                </p>
              </div>
            )
          )
        ) : (
          /* Inventory Mode */
          <InventoryList
            inventory={filteredInventory}
            onRestockClick={(id) => {
              setPrefilledRestockId(id);
              setIsRestockOpen(true);
            }}
            onDeleteItem={handleDeleteInventoryItem}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) Area */}
      <div className="fixed bottom-6 right-0 z-30 max-w-lg w-full flex justify-end px-6 pointer-events-none">
        {activeTab === "ledger" ? (
          <button
            type="button"
            onClick={() => setIsAddDebtOpen(true)}
            className="pointer-events-auto bg-brand-charcoal text-white rounded-full p-4 shadow-xl hover:bg-[#2A2622] transition-colors flex items-center gap-1 cursor-pointer font-sans text-xs uppercase tracking-wider font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add Record</span>
          </button>
        ) : (
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
        )}
      </div>

      {/* Slide-over Bottom Sheets */}
      {activeDetailDebt && (
        <DebtDetailSheet
          debt={activeDetailDebt}
          onClose={() => setActiveDetailDebt(null)}
          onAddPayment={handleAddPartialPayment}
          onSettle={handleSettleDebt}
          onDelete={handleDeleteDebt}
        />
      )}

      {isAddDebtOpen && (
        <AddDebtForm
          inventory={inventory}
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
    </div>
  );
}
