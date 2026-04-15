import { NavLink } from 'react-router-dom';
import { FiHome, FiFileText, FiUser } from 'react-icons/fi';
import { IoWalletOutline } from 'react-icons/io5';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className="relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-90"
  >
    {({ isActive }) => (
      <>
        {/* Red active indicator at top */}
        {isActive && (
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full"
            style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)' }}
          />
        )}

        <div className="flex flex-col items-center gap-1 pt-1.5">
          {/* Icon circle bg when active */}
          <div
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300"
            style={isActive ? { background: 'rgba(220,38,38,0.08)' } : {}}
          >
            <Icon
              className={`w-[22px] h-[22px] transition-all duration-300 ${
                isActive ? 'stroke-[2.5px] text-red-600' : 'text-gray-400'
              }`}
            />
          </div>
          <span
            className={`text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${
              isActive ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {label}
          </span>
        </div>
      </>
    )}
  </NavLink>
);

export default function BottomNav() {
  return (
    <nav
      className="w-full flex items-stretch bg-white"
      style={{
        height: '68px',
        borderTop: '1px solid #f0f0f0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
        position: 'sticky',
        bottom: 0,
        zIndex: 50,
      }}
    >
      <NavItem to="/"        icon={FiHome}         label="Home"    />
      <NavItem to="/tickets" icon={FiFileText}      label="Tickets" />
      <NavItem to="/balance" icon={IoWalletOutline} label="Wallet"  />
      <NavItem to="/profile" icon={FiUser}          label="Profile" />
    </nav>
  );
}
