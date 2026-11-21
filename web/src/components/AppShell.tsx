import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";

import { api, ConversationSummary } from "../api";
import { useAuth } from "../auth";
import { Brand } from "./Brand";
import { Icon } from "./Icon";

export interface ShellContext {
  refreshConversations: () => void;
}

export default function AppShell() {
  const { signOut, me } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  /* The layout cannot see child params, so match the chat URL directly. */
  const activeId = useMatch("/c/:id")?.params.id;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [open, setOpen] = useState(false);

  const refreshConversations = useCallback(() => {
    api.conversations().then(setConversations).catch(() => {});
  }, []);

  useEffect(refreshConversations, [refreshConversations]);

  /* Close the drawer after navigating on a phone. */
  useEffect(() => setOpen(false), [location.pathname]);

  async function remove(c: ConversationSummary) {
    if (!window.confirm(`Delete "${c.title}"? This can't be undone.`)) return;
    try {
      await api.deleteConversation(c.id);
      setConversations((list) => list.filter((x) => x.id !== c.id));
      if (c.id === activeId) navigate("/");
    } catch (error) {
      window.alert((error as Error).message);
    }
  }

  const firstName = me?.profile?.fullName?.split(" ")[0];

  return (
    <div className={`shell ${open ? "drawer-open" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Brand />
          <button className="icon-btn only-mobile" onClick={() => setOpen(false)} aria-label="Close menu">
            <Icon name="x" />
          </button>
        </div>

        <button className="btn new-chat" onClick={() => navigate("/")}>
          <Icon name="plus" size={16} /> New chat
        </button>

        <nav className="conversations" aria-label="Your conversations">
          {conversations.length === 0 && <p className="muted small pad">Your conversations will appear here.</p>}
          {conversations.map((c) => (
            <div key={c.id} className={`conv ${c.id === activeId ? "active" : ""}`}>
              <NavLink to={`/c/${c.id}`} className="conv-link" title={c.title}>
                {c.title}
              </NavLink>
              <button className="icon-btn conv-delete" onClick={() => remove(c)} aria-label={`Delete ${c.title}`}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/chart" className="side-link">
            <Icon name="chart" size={16} /> Your chart
          </NavLink>
          <NavLink to="/profile" className="side-link">
            <Icon name="user" size={16} /> {firstName ? `${firstName}'s profile` : "Profile"}
          </NavLink>
          <button className="side-link" onClick={signOut}>
            <Icon name="out" size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="scrim only-mobile" onClick={() => setOpen(false)} />

      <main className="main">
        <div className="mobile-bar only-mobile">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <Brand />
          <button className="icon-btn" onClick={() => navigate("/")} aria-label="New chat">
            <Icon name="plus" />
          </button>
        </div>
        <Outlet context={{ refreshConversations } satisfies ShellContext} />
      </main>
    </div>
  );
}
