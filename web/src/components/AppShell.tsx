import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth";
import { Brand } from "./Brand";
import { Icon } from "./Icon";

/* One continuous chat, so no thread list: a slim top bar with the few places there are. */
export default function AppShell() {
  const { signOut } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="topbar-brand" aria-label="Saarthi, chat">
          <Brand />
        </NavLink>
        <nav className="topnav" aria-label="Main">
          <NavLink to="/" end className="topnav-link">
            <Icon name="compass" size={17} />
            <span>Chat</span>
          </NavLink>
          <NavLink to="/chart" className="topnav-link">
            <Icon name="chart" size={17} />
            <span>Your chart</span>
          </NavLink>
          <NavLink to="/profile" className="topnav-link">
            <Icon name="user" size={17} />
            <span>Profile</span>
          </NavLink>
          <button className="topnav-link" onClick={signOut}>
            <Icon name="out" size={17} />
            <span>Sign out</span>
          </button>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
