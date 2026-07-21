"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Wallet, Plus, Trash2, Edit3, TrendingUp, TrendingDown, X, Coins } from "lucide-react";
import { useGoldContext } from "@/context/GoldContext";
import { formatCurrency, formatPrice, cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Holding {
  id: string;
  name: string;
  karat: number;
  weight: number;
  buyPrice: number;
  buyDate: string;
  notes: string | null;
}

interface HoldingWithValue extends Holding {
  currentValue: number;
  profit: number;
  profitPercent: number;
}

const KARATS = [24, 21, 18, 14];
const PURITY: Record<number, number> = { 24: 1, 21: 0.875, 18: 0.75, 14: 0.585 };

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric" }).format(new Date(dateString));
}

export function PortfolioContent() {
  const { data: session } = useSession();
  const { prices } = useGoldContext();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formKarat, setFormKarat] = useState(21);
  const [formWeight, setFormWeight] = useState("");
  const [formBuyPrice, setFormBuyPrice] = useState("");
  const [formBuyDate, setFormBuyDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchHoldings = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      const data = await res.json();
      if (data.success) setHoldings(data.data);
    } catch (err) {
      console.error("[portfolio] Failed to fetch holdings:", err);
      toast.error("تعذر تحميل المحفظة، حاول مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchHoldings();
  }, [session, fetchHoldings]);

  const getPrice = (karat: number) => {
    if (!prices) return 0;
    if (karat === 24) return prices.karat24.buyPrice;
    if (karat === 21) return prices.karat21.buyPrice;
    if (karat === 18) return prices.karat18.buyPrice;
    return prices.karat21.buyPrice * PURITY[karat];
  };

  const holdingsWithValue: HoldingWithValue[] = holdings.map((h) => {
    const currentPrice = getPrice(h.karat);
    const currentValue = Math.round(currentPrice * h.weight);
    const investedAmount = Math.round(h.buyPrice * h.weight);
    const profit = currentValue - investedAmount;
    const profitPercent = investedAmount > 0 ? Math.round((profit / investedAmount) * 10000) / 100 : 0;
    return { ...h, currentValue, profit, profitPercent };
  });

  const totalInvested = holdingsWithValue.reduce((sum, h) => sum + Math.round(h.buyPrice * h.weight), 0);
  const totalCurrentValue = holdingsWithValue.reduce((sum, h) => sum + h.currentValue, 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? Math.round((totalProfit / totalInvested) * 10000) / 100 : 0;

  const resetForm = () => {
    setFormName("");
    setFormKarat(21);
    setFormWeight("");
    setFormBuyPrice("");
    setFormBuyDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (h: Holding) => {
    setFormName(h.name);
    setFormKarat(h.karat);
    setFormWeight(String(h.weight));
    setFormBuyPrice(String(h.buyPrice));
    setFormBuyDate(h.buyDate.split("T")[0]);
    setFormNotes(h.notes ?? "");
    setEditingId(h.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formWeight || !formBuyPrice) return;
    setIsSaving(true);
    try {
      const body = {
        name: formName,
        karat: formKarat,
        weight: parseFloat(formWeight),
        buyPrice: parseFloat(formBuyPrice),
        buyDate: formBuyDate,
        notes: formNotes || undefined,
      };

      if (editingId) {
        await fetch(`/api/portfolio/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      resetForm();
      fetchHoldings();
    } catch (err) {
      console.error("[portfolio] Failed to save holding:", err);
      toast.error("تعذر حفظ الصنف، حاول مرة أخرى");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الصنف؟")) return;
    try {
      await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
      fetchHoldings();
    } catch (err) {
      console.error("[portfolio] Failed to delete holding:", err);
      toast.error("تعذر حذف الصنف، حاول مرة أخرى");
    }
  };

  if (!session) {
    return (
      <div className="text-center py-16">
        <Wallet className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="font-bold text-lg mb-2">سجّل الدخول أولاً</p>
        <p className="text-sm text-muted-foreground mb-4">تحتاج حساب لمتابعة محفظتك</p>
        <Link href="/auth/signin" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-500 text-white font-bold hover:bg-gold-600 transition-colors">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg">محفظتي</h1>
            <p className="text-xs text-muted-foreground">تتبع استثماراتك في الذهب</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-bold hover:bg-gold-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة
        </button>
      </div>

      {/* Portfolio Summary */}
      {holdingsWithValue.length > 0 && (
        <div className="rounded-2xl border-2 border-gold-500/30 bg-gradient-to-br from-gold-500/15 to-amber-600/10 p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">الإجمالي المستثمر</p>
              <p className="text-sm font-black mt-1">{formatCurrency(totalInvested)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">القيمة الحالية</p>
              <p className="text-sm font-black mt-1 gold-text">{formatCurrency(totalCurrentValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{totalProfit >= 0 ? "الربح" : "الخسارة"}</p>
              <p className={cn("text-sm font-black mt-1", totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
              </p>
              <p className={cn("text-[11px] font-bold", totalProfitPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                {totalProfitPercent >= 0 ? "+" : ""}{totalProfitPercent}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm">{editingId ? "تعديل الصنف" : "إضافة صنف جديد"}</h2>
            <button onClick={resetForm} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">اسم الصنف</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="مثال: خاتم ذهب، سبحة" maxLength={100}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-border focus:outline-none focus:border-gold-500 transition-colors text-sm" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">العيار</label>
            <div className="grid grid-cols-4 gap-2">
              {KARATS.map((k) => (
                <button key={k} type="button" onClick={() => setFormKarat(k)}
                  className={cn("py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
                    formKarat === k ? "border-gold-500 bg-gold-500/10 text-gold-600 dark:text-gold-400" : "border-border bg-muted/30 text-muted-foreground"
                  )}>عيار {k}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">الوزن (جرام)</label>
              <input type="number" value={formWeight} onChange={(e) => setFormWeight(e.target.value)}
                placeholder="0.00" min="0" step="0.01" inputMode="decimal"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-border focus:outline-none focus:border-gold-500 transition-colors text-sm font-bold text-center" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">سعر الشراء (ج.م/جرام)</label>
              <input type="number" value={formBuyPrice} onChange={(e) => setFormBuyPrice(e.target.value)}
                placeholder="0" min="0" step="1" inputMode="decimal"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-border focus:outline-none focus:border-gold-500 transition-colors text-sm font-bold text-center" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">تاريخ الشراء</label>
            <input type="date" value={formBuyDate} onChange={(e) => setFormBuyDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-border focus:outline-none focus:border-gold-500 transition-colors text-sm" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ملاحظات (اختياري)</label>
            <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
              placeholder="ملاحظات إضافية" maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border-2 border-border focus:outline-none focus:border-gold-500 transition-colors text-sm" />
          </div>

          <button onClick={handleSubmit} disabled={isSaving || !formName || !formWeight || !formBuyPrice}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-sm transition-all",
              isSaving || !formName || !formWeight || !formBuyPrice
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-gold-500 text-white hover:bg-gold-600"
            )}>
            {isSaving ? "جاري الحفظ..." : editingId ? "تحديث" : "إضافة"}
          </button>
        </div>
      )}

      {/* Holdings List */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!isLoading && holdingsWithValue.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Coins className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-lg">المحفظة فارغة</p>
          <p className="text-sm opacity-60 mt-1">أضف استثماراتك لتتبع قيمتها</p>
        </div>
      )}

      <div className="space-y-3">
        {holdingsWithValue.map((h, i) => (
          <div key={h.id} className="gold-card p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm">{h.name}</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20">
                    عيار {h.karat}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {h.weight} جرام · سعر الشراء: {formatPrice(h.buyPrice)} ج.م
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDate(h.buyDate)} · {formatCurrency(Math.round(h.buyPrice * h.weight))}
                </p>
                {h.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{h.notes}</p>}
              </div>

              <div className="flex items-center gap-2">
                <div className="text-left">
                  <p className="text-sm font-black">{formatCurrency(h.currentValue)}</p>
                  <p className={cn("text-[11px] font-bold", h.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                    {h.profit >= 0 ? "+" : ""}{formatCurrency(h.profit)} ({h.profitPercent >= 0 ? "+" : ""}{h.profitPercent}%)
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => startEdit(h)} aria-label="تعديل" className="p-2.5 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Edit3 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(h.id)} aria-label="حذف" className="p-2.5 rounded-lg hover:bg-red-500/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
