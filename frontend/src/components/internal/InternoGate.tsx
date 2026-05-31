import { useEffect, useState } from "react";
import { getAuthToken, getStoredUser, homePathForRole } from "../../lib/auth";

type GateMode = "route-home" | "guest-only" | "require-auth";

interface Props {
  mode: GateMode;
}

function hasSession(): boolean {
  return Boolean(getStoredUser() && getAuthToken());
}

export default function InternoGate({ mode }: Props) {
  const [blocked, setBlocked] = useState(mode !== "guest-only");

  useEffect(() => {
    const user = getStoredUser();
    const loggedIn = hasSession();

    if (mode === "route-home") {
      window.location.replace(
        loggedIn && user ? homePathForRole(user.rol) : "/interno/login/",
      );
      return;
    }

    if (mode === "guest-only") {
      if (loggedIn && user) {
        window.location.replace(homePathForRole(user.rol));
        return;
      }
      setBlocked(false);
      return;
    }

    if (mode === "require-auth") {
      if (!loggedIn) {
        window.location.replace("/interno/login/");
        return;
      }
      setBlocked(false);
    }
  }, [mode]);

  if (!blocked) return null;

  return (
    <div className="internal-gate" aria-live="polite">
      <span className="internal-gate-dot" aria-hidden="true" />
      <p className="internal-muted">Un momento…</p>
    </div>
  );
}

export { hasSession };
