import { ShoppingCart, Trash2, ShieldCheck, Zap, Minus, Plus, Loader2 } from "lucide-react";

interface CartItem {
  id: string;
  size: string;
  weight: string | number;
  itemType: string;
  deliveryGuarantee: "basic" | "standard" | "premium";
  quantity: number;
}

interface ParcelCartProps {
  items: CartItem[];
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onContinue: () => void;
  busyItemId?: string | null;
}

export default function ParcelCart({ 
  items, 
  onUpdateQuantity,
  onRemoveItem, 
  onContinue: _onContinue,
  busyItemId,
}: ParcelCartProps) {
  
  const getItemTypeData = (type: string) => {
    const data: Record<string, { label: string; icon: string }> = {
      document: { label: "Document", icon: "📄" },
      food: { label: "Food", icon: "🍴" },
      clothing: { label: "Clothing", icon: "👔" },
      electronics: { label: "Electronics", icon: "📱" },
      fragile: { label: "Fragile", icon: "⚠️" },
      other: { label: "Other", icon: "📦" },
    };
    const key = type.toLowerCase();
    return data[key] || { label: type, icon: "📦" };
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-[2rem] p-12 text-center shadow-2xl shadow-gray-200/50">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
           <ShoppingCart className="w-6 h-6 text-gray-300" />
        </div>
        <h3 className="text-[#041614] font-bold text-lg">Your cart is empty</h3>
        <p className="text-gray-400 text-sm mt-1">Add items to begin your delivery booking.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-2xl shadow-gray-200/50 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#041614] tracking-tight">Order summary</h2>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 border border-gray-100">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#F0F9F8] flex items-center justify-center border border-[#39B5A8]/10">
          <ShoppingCart className="w-5 h-5 text-[#39B5A8]" />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => {
          const itemData = getItemTypeData(item.itemType);
          const isSensitive = ["food", "fragile"].includes(item.itemType.toLowerCase());
          const isBusy = busyItemId === item.id;

          return (
            <div
              key={item.id}
              className="flex flex-col gap-4 p-5 rounded-[1.5rem] border-2 border-gray-50 bg-gray-50/40 hover:bg-white hover:border-gray-100 transition-all group relative"
            >
              {/* Top Row: Icon + Type + Delete */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 text-xl shadow-sm border border-gray-100 transition-transform group-hover:scale-105">
                  {itemData.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#041614] text-base leading-none">
                    {itemData.label}
                  </p>
                  <p className="text-[11px] font-medium text-gray-400 mt-1">
                    Qty: {item.quantity} • Parcel details
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isBusy}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                  aria-label="Remove item"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Middle Row: Specs Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100/80">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Size</p>
                  <p className="text-xs font-bold text-[#041614]">Parcel {item.size}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-xs font-bold text-[#041614]">
                    {item.weight.toString().toLowerCase().includes('kg') ? item.weight : `${item.weight}kg`}
                  </p>
                </div>
              </div>

              {/* Protection & Service Constraint Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#F0F9F8] rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#39B5A8]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#39B5A8] capitalize">
                    {item.deliveryGuarantee} protection
                  </span>
                </div>
                
                {isSensitive && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-md border border-orange-100" title="Sensitive items require direct delivery">
                    <Zap className="w-3 h-3 text-orange-500" />
                    <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider">
                      PakiExpress Only
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Adjust Quantity
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!onUpdateQuantity || isBusy || item.quantity <= 1}
                    onClick={() => onUpdateQuantity?.(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#39B5A8] hover:border-[#39B5A8]/30 transition-all disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4 mx-auto" />
                  </button>
                  <span className="min-w-8 text-center font-bold text-[#041614]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!onUpdateQuantity || isBusy}
                    onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#39B5A8] hover:border-[#39B5A8]/30 transition-all disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Action */}
      <div className="space-y-4 pt-2">
        <div className="bg-[#F0F9F8] rounded-2xl p-4 border border-[#39B5A8]/10 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#39B5A8]" />
          <p className="text-[11px] font-medium text-[#041614]/70 leading-relaxed">
            All parcels in your cart are covered by <strong>PakiShip Shield</strong>. You can review your items before final checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
