import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Package, Truck, Clipboard, Plus, AlertCircle, CheckSquare, Sparkles } from 'lucide-react';

export const SupplyChain: React.FC = () => {
  const { inventory, purchaseOrders, createPO, deliverPO, logApiCall } = useErp();
  const [vendorName, setVendorName] = useState('HPE');
  
  const [itemName, setItemName] = useState('Kubernetes Master Node Servers');
  const [itemQty, setItemQty] = useState('10');
  const [itemPrice, setItemPrice] = useState('4200');

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = performance.now();
    const qty = parseInt(itemQty);
    const price = parseFloat(itemPrice);
    const amount = qty * price;

    await createPO({
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName,
      amount,
      items: [{ name: itemName, qty, unitPrice: price }]
    });

    
    setItemQty('');
    logApiCall('POST', '/api/v1/supply-chain/po', 201, Math.round(performance.now() - start));
  };

  const handleDeliver = async (poId: string) => {
    const start = performance.now();
    await deliverPO(poId);
    logApiCall('POST', `/api/v1/supply-chain/po/${poId}/deliver`, 200, Math.round(performance.now() - start));
    alert('Delivery receipt logged. Inventory counts automatically incremented.');
  };

  // Find items requiring reorder (quantity <= minStockLevel)
  const lowStockItems = inventory.filter(item => item.quantity <= item.minStockLevel);

  const handleAutoReorder = async (item: typeof inventory[0]) => {
    const start = performance.now();
    await createPO({
      poNumber: `AUTO-PO-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName: item.supplier,
      amount: item.reorderQuantity * item.unitPrice,
      items: [{ name: item.name, qty: item.reorderQuantity, unitPrice: item.unitPrice }]
    });
    logApiCall('POST', '/api/v1/supply-chain/po/auto-reorder', 201, Math.round(performance.now() - start));
    alert(`Automated Reorder PO created for ${item.reorderQuantity} units of "${item.name}" from ${item.supplier}.`);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-2xl font-display font-bold text-slate-100 flex items-center gap-3">
          <Package className="w-6 h-6 text-purple-400" /> Supply Chain & Inventory Control (F-05)
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Monitor warehouse stock levels, create purchase orders, automate reorder workflows, and verify delivery receipt logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PO Creation Wizard */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <form onSubmit={handleCreatePO} className="space-y-4">
            <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-purple-400" /> Generate Purchase Order
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Supplier / Vendor</label>
                <select
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-350 focus:outline-none"
                >
                  <option value="HPE">HPE</option>
                  <option value="Cisco Systems">Cisco Systems</option>
                  <option value="Yubico">Yubico</option>
                  <option value="Lenovo Inc">Lenovo Inc</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Item Description</label>
                <input 
                  type="text" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Cisco Switch Catalyst 9300"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Quantity</label>
                  <input 
                    type="number" 
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    placeholder="1"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Unit Price ($)</label>
                  <input 
                    type="number" 
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-500 text-slate-100 font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 mt-4"
            >
              <Plus className="w-4 h-4" /> Issue Purchase Order
            </button>
          </form>

          <div className="text-[10px] text-slate-500 text-center mt-4">
            PO undergoes automatic budget check against active allocations.
          </div>
        </div>

        {/* Auto Reorder Panel */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Automated Stock Reorder Alerts
            </h3>

            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map(item => (
                  <div key={item.id} className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-200">{item.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        SKU: {item.sku} | Quantity: <span className="text-rose-450 font-bold">{item.quantity}</span> (Min Threshold: {item.minStockLevel})
                      </div>
                    </div>

                    <button 
                      onClick={() => handleAutoReorder(item)}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-100 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Reorder {item.reorderQuantity} Units
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl text-center text-slate-500 text-xs space-y-2">
                <CheckSquare className="w-8 h-8 text-emerald-400 mx-auto" />
                <span className="block text-slate-350 font-medium">Inventory thresholds secure</span>
                <span>No warehouse items require critical reorder.</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 mt-6 leading-relaxed">
            Reorder thresholds are evaluated dynamically. When stock levels drop below the safety limit, the system initiates supplier PO dispatch.
          </div>
        </div>
      </div>

      {/* Inventory Sheet */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Inventory Table */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-slate-400" /> Warehouse Inventory Sheet
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="pb-3">Item / SKU</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Quantity</th>
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="py-3.5 space-y-1">
                      <div className="font-semibold text-slate-250">{item.name}</div>
                      <div className="text-[10px] text-slate-550 font-mono">SKU: {item.sku}</div>
                    </td>
                    <td className="py-3.5 text-slate-400 font-medium">{item.category}</td>
                    <td className="py-3.5 text-right font-mono font-medium text-slate-250">{item.quantity} units</td>
                    <td className="py-3.5 text-slate-400">{item.supplier}</td>
                    <td className="py-3.5">
                      {item.status === 'In Stock' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">In Stock</span>
                      )}
                      {item.status === 'Low Stock' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">Low Stock</span>
                      )}
                      {item.status === 'Out of Stock' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">Out of Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PO Logs */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-slate-400" /> Active Purchase Orders
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="pb-3">PO Number / Supplier</th>
                  <th className="pb-3">Item Details</th>
                  <th className="pb-3 text-right">Total Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="py-3.5 space-y-1">
                      <div className="font-semibold text-slate-250">{po.vendorName}</div>
                      <div className="text-[10px] text-slate-550 font-mono">{po.poNumber} | Date: {po.date}</div>
                    </td>
                    <td className="py-3.5">
                      {po.items.map((item, index) => (
                        <div key={index} className="text-slate-350">
                          {item.name} <span className="text-slate-500">(x{item.qty})</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 text-right font-mono font-medium text-slate-250">
                      ${po.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5">
                      {po.status === 'Sent' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">PO Dispatched</span>
                      )}
                      {po.status === 'Approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium">Approved</span>
                      )}
                      {po.status === 'Delivered' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">Received (GR)</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      {po.status !== 'Delivered' ? (
                        <button 
                          onClick={() => handleDeliver(po.id)}
                          className="bg-purple-600 hover:bg-purple-500 text-slate-100 font-semibold px-3 py-1 rounded-lg text-[10px] transition-all ml-auto block"
                        >
                          Log Receipt
                        </button>
                      ) : (
                        <span className="text-slate-500 italic text-[10px]">Restocked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
