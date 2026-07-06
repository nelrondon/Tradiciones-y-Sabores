import { useState } from 'react';
import { Sandwich, Coffee, UserPlus, Timer, Armchair, ShoppingBag, Bike, Info, Trash2, Edit2, Send, UtensilsCrossed, Plus, Image as ImageIcon } from 'lucide-react';

export default function PosView() {
  const [orderType, setOrderType] = useState<'mesa' | 'pickup' | 'delivery'>('mesa');

  return (
    <div className="flex-1 flex bg-background p-6 gap-6 h-full min-h-[calc(100vh-64px)]">
      {/* Left Area: Catalog (Products) */}
      <section className="flex-1 flex flex-col bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {/* Category Tabs */}
        <div className="flex border-b border-outline-variant bg-surface-container-highest">
          <button className="flex-1 py-4 text-sm font-bold text-primary border-b-4 border-primary bg-surface transition-colors flex items-center justify-center gap-2">
            <UtensilsCrossed size={20} />
            Hamburguesas
          </button>
          <button className="flex-1 py-4 text-sm font-bold text-on-surface-variant hover:bg-surface-variant border-b-4 border-transparent transition-colors flex items-center justify-center gap-2">
            <Sandwich size={20} />
            Pepitos
          </button>
          <button className="flex-1 py-4 text-sm font-bold text-on-surface-variant hover:bg-surface-variant border-b-4 border-transparent transition-colors flex items-center justify-center gap-2">
            <Coffee size={20} />
            Bebidas
          </button>
        </div>

        {/* Product Grid (High-Density Fluid) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 content-start">
          {/* Product Card 1 */}
          <article className="bg-surface border border-outline-variant rounded-lg p-3 flex flex-col gap-3 hover:border-primary transition-colors cursor-pointer group">
            <div className="aspect-square bg-surface-variant rounded overflow-hidden relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBytJfx2XtCPBa3wdfY6roEytoOt6ZYmFy8LFsFvwyiXfgDK8jKHGcfYTGPuNKoc4bGAvs0kxOOz48RzxWThordEtiCsbRRlwpmpzqZBL3--p0y0CBqAwbZVzHJEJNypvLgLUXrbPTiQFHzMmWmeV2YdGaaHw2fnFHGcSMsAErKG0YgeCHNpoyWpfLqMSKYya3Gx1XSs1_kns57DdUPr1Di3VO1m596fcl-u1V_lrs8OsjAw8bKQW8" 
                alt="La Industrial"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="text-base font-bold text-on-surface leading-tight">La Industrial</h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">Doble carne, cheddar fundido, tocineta, salsa de la casa, pan brioche.</p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-variant">
              <span className="font-mono text-lg font-bold text-primary">$12.50</span>
              <button className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center hover:bg-secondary-container hover:text-on-secondary-container transition-colors active:scale-95">
                <Plus size={18} />
              </button>
            </div>
          </article>

          {/* Product Card 2 */}
          <article className="bg-surface border border-outline-variant rounded-lg p-3 flex flex-col gap-3 hover:border-primary transition-colors cursor-pointer group">
            <div className="aspect-square bg-surface-variant rounded overflow-hidden relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkOKqVNPSf9mmHYO6EsLsWralxeWuT2M1nWKiCZLhBSNzJ3YigaVJM2XY8K5nBbQCMm3ZIuSwPrSgUv8CGQQV_Oasx63-v4k6cJawrsAAmPVsAExYEsj3Fdzd863MwyOK5t2q_cTXDJmdLtjhQeaCk_pDCbbKSdzq5MIgd2LN28nKl9aDZkIKaFkPoQN9-qu8Q7sEFTm_ZwSGMyP40VGT2RorRGXzrkZjXnbxQfVJKMO4kMuY9tjw"
                alt="Clásica"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="text-base font-bold text-on-surface leading-tight">Clásica</h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">Carne de res 150g, vegetales frescos, queso amarillo.</p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-variant">
              <span className="font-mono text-lg font-bold text-primary">$8.00</span>
              <button className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center hover:bg-secondary-container hover:text-on-secondary-container transition-colors active:scale-95">
                <Plus size={18} />
              </button>
            </div>
          </article>

          {/* Product Card 3 (Out of stock example) */}
          <article className="bg-surface-variant border border-outline-variant rounded-lg p-3 flex flex-col gap-3 opacity-60 grayscale cursor-not-allowed">
            <div className="aspect-square bg-surface-dim rounded overflow-hidden relative flex items-center justify-center">
              <span className="absolute inset-0 bg-surface/50 flex items-center justify-center text-sm font-bold text-error uppercase tracking-widest z-10 backdrop-blur-sm">Agotado</span>
              <UtensilsCrossed size={48} className="text-outline" />
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="text-base font-bold text-on-surface leading-tight">Pollo Crispy</h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">Pechuga empanizada, ensalada coleslaw.</p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-variant">
              <span className="font-mono text-lg font-bold text-on-surface-variant">$9.50</span>
            </div>
          </article>

          {/* Placeholder Card */}
          <article className="bg-surface border border-outline-variant rounded-lg p-3 flex flex-col gap-3 hover:border-primary transition-colors cursor-pointer border-dashed">
            <div className="aspect-square bg-surface-container-lowest rounded flex items-center justify-center border-2 border-dashed border-outline-variant">
              <ImageIcon size={48} className="text-outline" />
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="text-base font-bold text-on-surface leading-tight">Doble Smash</h3>
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-variant">
              <span className="font-mono text-lg font-bold text-primary">$10.00</span>
              <button className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center hover:bg-secondary-container hover:text-on-secondary-container transition-colors active:scale-95">
                <Plus size={18} />
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Right Area: Order Dashboard (Reception Form & Cart) */}
      <aside className="w-[480px] flex flex-col gap-6 shrink-0">
        {/* Customer Details Form */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <h2 className="text-lg font-bold text-primary flex items-center gap-2 uppercase tracking-wide border-b border-outline-variant pb-2">
            <UserPlus size={20} />
            Registro de Cliente
          </h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Cédula / RIF</label>
              <input type="text" placeholder="V-12345678" className="industrial-input font-mono text-sm" />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Teléfono</label>
              <input type="tel" placeholder="0414-0000000" className="industrial-input font-mono text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Nombre del Cliente</label>
              <input type="text" placeholder="EJ. JUAN PEREZ" className="industrial-input uppercase" />
            </div>
          </div>
        </div>

        {/* Order Type & Cart (Functional Brutalism) */}
        <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col shadow-sm relative overflow-hidden min-h-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary-container"></div>
          
          {/* Header */}
          <div className="p-6 border-b border-outline-variant bg-surface flex justify-between items-center shrink-0 mt-1">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">ID Ticket</span>
              <span className="font-mono text-2xl font-black text-primary leading-none mt-1">#ORD-9021</span>
            </div>
            <div className="bg-primary text-on-primary px-3 py-1.5 rounded font-mono text-lg flex items-center gap-2">
              <Timer size={20} />
              00:00
            </div>
          </div>

          {/* Order Type Selector */}
          <div className="p-6 border-b border-outline-variant bg-surface-container-highest shrink-0">
            <label className="text-xs font-bold text-on-surface-variant uppercase mb-3 block">Tipo de Pedido</label>
            <div className="flex gap-2 bg-surface-dim p-1 rounded-lg">
              <button 
                onClick={() => setOrderType('mesa')}
                className={`flex-1 h-12 text-sm font-bold uppercase rounded transition-all flex items-center justify-center gap-2 ${orderType === 'mesa' ? 'bg-primary text-on-primary shadow-sm' : 'bg-transparent text-on-surface hover:bg-surface'}`}
              >
                <Armchair size={20} /> Mesa
              </button>
              <button 
                onClick={() => setOrderType('pickup')}
                className={`flex-1 h-12 text-sm font-bold uppercase rounded transition-all flex items-center justify-center gap-2 ${orderType === 'pickup' ? 'bg-primary text-on-primary shadow-sm' : 'bg-transparent text-on-surface hover:bg-surface'}`}
              >
                <ShoppingBag size={20} /> Para Llevar
              </button>
              <button 
                onClick={() => setOrderType('delivery')}
                className={`flex-1 h-12 text-sm font-bold uppercase rounded transition-all flex items-center justify-center gap-2 ${orderType === 'delivery' ? 'bg-primary text-on-primary shadow-sm' : 'bg-transparent text-on-surface hover:bg-surface'}`}
              >
                <Bike size={20} /> Delivery
              </button>
            </div>

            {/* Dynamic Fields Area */}
            <div className="mt-6 min-h-[72px]">
              {orderType === 'mesa' && (
                <div className="animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">Número de Mesa</label>
                  <div className="flex gap-4">
                    <input type="number" placeholder="00" className="industrial-input font-mono text-xl w-24 text-center" />
                    <div className="flex-1 text-xs font-semibold text-on-surface-variant bg-surface-container p-3 rounded border border-outline-variant flex items-center gap-2">
                      <Info size={18} className="shrink-0" />
                      Asegure disponibilidad antes de asignar.
                    </div>
                  </div>
                </div>
              )}
              {orderType === 'delivery' && (
                <div className="animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">Dirección de Envío</label>
                  <textarea rows={2} placeholder="Sector, Calle, Referencia..." className="industrial-input h-auto py-3 resize-none"></textarea>
                </div>
              )}
            </div>
          </div>

          {/* Order Items List */}
          <div className="flex-1 overflow-y-auto p-4 bg-surface">
            {/* Item */}
            <div className="bg-surface-container border border-outline-variant p-3 rounded mb-2 flex flex-col gap-2 group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface-dim rounded flex items-center justify-center font-mono font-bold text-on-surface">1</div>
                  <span className="text-base font-bold text-primary uppercase">La Industrial</span>
                </div>
                <span className="font-mono font-bold text-primary">$12.50</span>
              </div>
              {/* Modifications */}
              <div className="ml-11 bg-error-container text-on-error-container text-xs font-bold px-2 py-1 inline-flex items-center gap-1 rounded border border-error w-max">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                SIN CEBOLLA
              </div>
              <div className="ml-11 flex gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-on-surface-variant hover:text-error text-xs flex items-center gap-1 uppercase font-bold">
                  <Trash2 size={14} /> Eliminar
                </button>
                <button className="text-on-surface-variant hover:text-primary text-xs flex items-center gap-1 uppercase font-bold">
                  <Edit2 size={14} /> Editar
                </button>
              </div>
            </div>
          </div>

          {/* Totals & Actions */}
          <div className="bg-surface-container-highest border-t border-outline-variant p-6 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span className="text-sm font-bold uppercase">Subtotal</span>
              <span className="font-mono">$12.50</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant border-b border-outline-variant pb-2">
              <span className="text-sm font-bold uppercase">IVA (16%)</span>
              <span className="font-mono">$2.00</span>
            </div>
            <div className="flex justify-between items-end mt-2">
              <span className="text-lg uppercase text-primary font-black">Total a Pagar</span>
              <span className="font-mono text-3xl text-secondary-container leading-none font-black">$14.50</span>
            </div>
            
            <button className="mt-6 w-full h-16 bg-secondary-container hover:bg-secondary active:bg-secondary-container active:scale-[0.98] transition-all text-on-secondary-container text-lg font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]">
              <Send size={24} />
              Procesar Pedido
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
