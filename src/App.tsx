import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PosView from './views/PosView';
import KitchenView from './views/KitchenView';
import ReportsView from './views/ReportsView';

export default function App() {
  const [view, setView] = useState('pos');

  return (
    <div className="flex min-h-screen bg-background text-on-background font-sans overflow-hidden">
      <Sidebar currentView={view} setView={setView} />
      
      <div className="flex-1 flex flex-col md:ml-64 h-screen relative overflow-hidden">
        <TopBar currentView={view} setView={setView} />
        
        <main className="flex-1 overflow-y-auto">
          {view === 'pos' && <PosView />}
          {view === 'kitchen' && <KitchenView />}
          {view === 'reports' && <ReportsView />}
        </main>
      </div>
    </div>
  );
}
