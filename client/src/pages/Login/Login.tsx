import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useLang } from "../../i18n/LanguageContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const err = await login(email, password);

    setBusy(false);
    if (err) {
      setError(t("login.invalid"));
      return;
    }
    navigate("/");
  };

  return (
    <div className="login-page">
      <button className="login-lang-toggle" onClick={toggle} type="button">
        {lang === "he" ? "EN" : "עב"}
      </button>

      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">🏋️</div>
        <h1>{t("login.title")}</h1>

        <input
          type="email"
          placeholder={t("login.email")}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("login.password")}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="login-error">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? t("login.signingIn") : t("login.submit")}
        </button>
      </form>
    </div>
  );
}