import { useNavigate } from "react-router-dom";

import { api } from "../api";
import { useAuth } from "../auth";
import { Brand } from "../components/Brand";
import { ProfileForm } from "../components/ProfileForm";

export default function OnboardingPage() {
  const { me, refresh, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="onboarding">
      <header className="onboarding-top">
        <Brand />
        <button className="btn ghost small" onClick={signOut}>
          Sign out
        </button>
      </header>
      <ProfileForm
        mode="onboarding"
        initial={me?.profile}
        onSubmit={async (input) => {
          await api.saveOnboarding(input);
          await refresh();
          /* Offer what they said was on their mind as the first message. */
          navigate("/", { replace: true, state: { draft: input.entryQuestion } });
        }}
      />
    </div>
  );
}
