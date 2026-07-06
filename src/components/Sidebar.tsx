import { 
  Terminal, 
  PlusCircle, 
  LayoutDashboard, 
  ReceiptText, 
  Utensils, 
  Package, 
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

export default function Sidebar({ currentView, setView }: SidebarProps) {
  const navItems = [
    { id: 'pos', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos', icon: ReceiptText },
    { id: 'kitchen', label: 'Cocina', icon: Utensils },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'reports', label: 'Reportes', icon: Users }, // Using Users for Customers/Reports mix based on mockups
  ];

  return (
    <nav className="bg-surface-container-highest border-r border-outline-variant h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col p-6 z-40">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col gap-1">
        <div className="text-3xl font-black text-primary leading-none tracking-tighter uppercase flex items-center gap-2">
          UDO-FAT
        </div>
        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-3">
          Terminal Admin
        </div>
      </div>

      {/* CTA Action */}
      <button 
        onClick={() => setView('pos')}
        className="bg-secondary-container text-on-secondary-container text-sm font-bold py-3 px-4 rounded flex items-center justify-center gap-2 mb-8 border-2 border-secondary-container hover:bg-surface-container-highest hover:text-secondary-container transition-all h-12 uppercase tracking-wide"
      >
        <PlusCircle size={20} />
        Nuevo Pedido
      </button>

      {/* Navigation Links */}
      <div className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (currentView === 'reports' && item.id === 'reports');
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 p-3 rounded-lg text-sm font-bold transition-colors active:translate-y-0.5 duration-100 ${
                isActive 
                  ? 'bg-secondary-container text-on-secondary-container' 
                  : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col gap-2 mt-auto pt-6 border-t border-outline-variant">
        <button className="flex items-center gap-3 p-3 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-variant transition-colors active:translate-y-0.5 duration-100">
          <Settings size={20} />
          <span>Configuración</span>
        </button>
        <button className="flex items-center gap-3 p-3 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-variant transition-colors active:translate-y-0.5 duration-100">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>

        {/* Profile Avatar */}
        <div className="mt-3 flex items-center gap-3 p-3 bg-surface-container rounded border border-outline-variant">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2kTrv46yEmGDCWXt7IYt4Zq0WTr9lNSNb52nl64RTk54eapxdmkVBghkBhBfpW0AjVG4kMaX8Ut2jL3doyfeRqzoUCJpfjgvpOUFKMdLHyca_4DnnG-jbfChW0lIy2Le-_9efsERf0ZOwtbaOOFtLqWNoN8hwb4aTDvtHo3St2ahZ883G33XlT1atSxj8dmA9mOl29p0fC5QI-3TAb9URkoWw3m8J2E3lFk6DVnbfGtwTcn8TRWA" 
            alt="Admin" 
            className="w-8 h-8 rounded-full object-cover border border-outline"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-on-surface">SYS_ADMIN_01</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">En Línea</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
