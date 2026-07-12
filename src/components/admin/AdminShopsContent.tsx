"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Store } from "lucide-react";
import { toast } from "sonner";

interface Shop {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
}

export function AdminShopsContent() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    location: "",
  });

  const fetchShops = async () => {
    try {
      const res = await fetch("/api/shops-admin");
      const data = await res.json();
      setShops(Array.isArray(data) ? data : []);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.whatsapp || !form.address) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ");
        return;
      }

      toast.success("تم إضافة المحل بنجاح");
      setShowForm(false);
      setForm({ name: "", phone: "", whatsapp: "", address: "", location: "" });
      fetchShops();
    } catch {
      toast.error("حدث خطأ في الاتصال");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المحل؟")) return;

    try {
      const res = await fetch(`/api/shops/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("حدث خطأ");
        return;
      }
      toast.success("تم حذف المحل");
      fetchShops();
    } catch {
      toast.error("حدث خطأ في الاتصال");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم — المحلات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إجمالي المحلات: {shops.length}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "إلغاء" : "إضافة محل"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-card border border-border/50 space-y-4"
        >
          <h2 className="font-bold text-lg">إضافة محل جديد</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">اسم المحل *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
                placeholder="مثال: محل الذهب الملكي"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم التلفون *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
                placeholder="مثال: 01234567890"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم الواتساب *</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
                placeholder="مثال: 01234567890"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">العنوان *</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
                placeholder="مثال: وسط البلد، القاهرة"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">رابط جوجل ماب (اختياري)</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gold-gradient text-white font-medium hover:opacity-90 transition-opacity"
          >
            حفظ المحل
          </button>
        </form>
      )}

      {shops.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">لا يوجد محلات مضافة بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="p-4 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold">{shop.name}</h3>
                    <p className="text-sm text-muted-foreground">{shop.address}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>ت: {shop.phone}</span>
                      <span>واتساب: {shop.whatsapp}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(shop.id)}
                  className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center shrink-0 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
