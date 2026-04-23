import { LayoutDashboard, Dumbbell, Apple, Clock, TrendingUp, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Tab = 'dashboard' | 'workout' | 'nutrition' | 'schedule' | 'progress';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: 'dashboard' as Tab, label: 'Accueil', icon: LayoutDashboard },
  { id: 'workout' as Tab, label: 'Séance', icon: Dumbbell },
  { id: 'nutrition' as Tab, label: 'Nutrition', icon: Apple },
  { id: 'schedule' as Tab, label: 'Planning', icon: Clock },
  { id: 'progress' as Tab, label: 'Progrès', icon: TrendingUp },
];

export default function Navbar({ activeTab, onTabChange }: Props) {
  const { signOut } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-20 bg-slate-900 border-r border-slate-800 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center justify-center py-5 border-b border-slate-800">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1 py-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              title={label}
              className={`group flex flex-col items-center gap-1 w-14 py-3 rounded-xl transition-all duration-200 ${
                activeTab === id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </nav>

        <div className="pb-4 flex justify-center">
          <button
            onClick={signOut}
            title="Se déconnecter"
            className="flex flex-col items-center gap-1 w-14 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[9px]">Sortir</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                activeTab === id
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${activeTab === id ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
