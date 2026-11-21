import { api } from "../api";
import { useAuth } from "../auth";
import { ProfileForm } from "../components/ProfileForm";

export default function ProfilePage() {
  const { me, refresh } = useAuth();

  return (
    <div className="page">
      <header className="page-head">
        <h1>Your profile</h1>
        <p className="muted">
          Signed in as {me?.email}. Changing your birth details rebuilds your chart; your answers about yourself shape how
          Saarthi talks with you.
        </p>
      </header>
      <ProfileForm
        mode="edit"
        initial={me?.profile}
        onSubmit={async (input) => {
          await api.saveOnboarding(input);
          await refresh();
        }}
      />
    </div>
  );
}
