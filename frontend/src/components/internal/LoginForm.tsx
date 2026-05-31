import { useState } from "react";
import { homePathForRole, setAuthSession } from "../../lib/auth";
import { loginInternal } from "../../lib/internal-api";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await loginInternal(email, password);
      setAuthSession(token, user);
      window.location.href = homePathForRole(user.rol);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión.");
      setLoading(false);
    }
  };

  return (
    <form className="internal-login-form" onSubmit={(e) => void submit(e)} noValidate>
      <label className="wizard-label">
        <span className="wizard-label-text">Correo institucional</span>
        <input
          type="email"
          autoComplete="username"
          className="form-field"
          placeholder="nombre@institucion.edu.pe"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="wizard-label">
        <span className="wizard-label-text">Contraseña</span>
        <input
          type="password"
          autoComplete="current-password"
          className="form-field"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && (
        <p className="help-message help-message--error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary internal-login-submit" disabled={loading}>
        {loading ? "Ingresando…" : "Ingresar al panel"}
      </button>

      <p className="internal-login-hint">
        Cuentas de prueba en local:{" "}
        <strong>admin@loqueleo.test</strong> / <strong>admin123</strong> ·{" "}
        <strong>jurado@loqueleo.test</strong> / <strong>jurado123</strong>
      </p>
    </form>
  );
}
