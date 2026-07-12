"use client";

import { useEffect, useState } from "react";
import { Store, Phone, MessageCircle, MapPin, Plus, Search, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

const WHATSAPP_NUMBER = "201159130500";
const WHATSAPP_MESSAGE = encodeURIComponent("مرحباً، أريد إضافة محلي في دليل محلات ذهب مصر");
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mmomm21235@gmail.com";

interface Shop {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  location: string | null;
}

export function ShopsContent() {
  const { data: session } = useSession();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", whatsapp: "", address: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const fetchShops = () => {
    fetch("/api/shops")
      .then((res) => res.json())
      .then((data) => setShops(Array.isArray(data) ? data : []))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchShops(); }, []);

  const filtered = shops.filter(
    (s) => s.name.includes(search) || s.address.includes(search)
  );

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg("تمت إضافة المحل بنجاح!");
        setFormData({ name: "", phone: "", whatsapp: "", address: "", location: "" });
        setShowForm(false);
        fetchShops();
      } else {
        setSaveMsg(data.error || "حدث خطأ");
      }
    } catch {
      setSaveMsg("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-bold">دليل محلات الذهب</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {shops.length > 0
              ? `${shops.length} محل في الدليل`
              : "أول دليل متخصص لمحلات الذهب في مصر"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "إغلاق" : "إضافة محل"}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form onSubmit={handleAddShop} className="p-4 rounded-2xl bg-card border border-gold-500/30 space-y-3">
          <h3 className="font-bold text-sm">إضافة محل جديد</h3>
          <input
            required
            type="text"
            placeholder="اسم المحل"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="tel"
              placeholder="رقم التليفون"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />
            <input
              type="tel"
              placeholder="واتساب (اختياري)"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />
          </div>
          <input
            required
            type="text"
            placeholder="العنوان"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
          <input
            type="url"
            placeholder="رابط خرائط جوجل (اختياري)"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
          {saveMsg && (
            <p className={`text-sm font-medium ${saveMsg.includes("نجاح") ? "text-green-600" : "text-red-600"}`}>
              {saveMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "جاري الحفظ..." : "حفظ المحل"}
          </button>
        </form>
      )}

      {shops.length > 0 && (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن محل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
          />
        </div>
      )}

      {!loading && shops.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold">لا يوجد محلات بعد</h2>
            <p className="text-sm text-muted-foreground mt-1">
              كن أول من يضيف محله في دليل محلات الذهب
            </p>
          </div>
          {!isAdmin && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              أضف محلك
            </a>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {filtered.map((shop) => (
              <div
                key={shop.id}
                className="p-4 rounded-2xl bg-card border border-border/50 hover:border-gold-500/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base">{shop.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {shop.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <a
                    href={`tel:${shop.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-sm transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    اتصل
                  </a>
                  <a
                    href={`https://wa.me/${shop.whatsapp.replace(/^0/, "20")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/10 hover:bg-green-600/20 text-green-700 dark:text-green-400 text-sm transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    واتساب
                  </a>
                  {shop.location && (
                    <a
                      href={shop.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-sm transition-colors mr-auto"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      جوجل ماب
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4 pb-8">
            {!isAdmin ? (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-gradient text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                أضف محلك الآن
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                {"أنت تستخدم حساب الأدمن — استخدم زر \"إضافة محل\" أعلاه"}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
