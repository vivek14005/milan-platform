import { useEffect, useState } from "react";
import "./AuthPage.css";
import milanRoyalMandala from "../assets/milan-royal-mandala.png";

const API_URL = "/api";
const emptyForm = {
  full_name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  remember: true,
};

export default function AuthPage({
  onClose,
  onLoginSuccess,
  initialRole = "customer",
}) {
  const [role, setRole] = useState(initialRole === "vendor" ? "vendor" : "customer");
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isRegister = mode === "register";

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setMessage("");
  };

  const changeRole = (nextRole) => {
    setRole(nextRole);
    setError("");
    setMessage("");
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
    setShowPassword(false);
  };

  const submitLogin = async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim(),
        password: form.password,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || "Email or password is incorrect.");
    }

    const token = data.access_token || data.token;
    if (!token) throw new Error("Login token was not received.");

    const meResponse = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meResponse.json().catch(() => ({}));
    if (!meResponse.ok) {
      throw new Error(meData.detail || "Unable to verify this account.");
    }

    const verifiedRole = meData.role?.toString().trim().toLowerCase();
    if (verifiedRole && verifiedRole !== role && verifiedRole !== "admin") {
      const correctRole = verifiedRole === "vendor" ? "Vendor" : "Customer";
      throw new Error(`This is a ${correctRole} account. Please choose ${correctRole} Login.`);
    }

    const storage = form.remember ? localStorage : sessionStorage;
    const otherStorage = form.remember ? sessionStorage : localStorage;
    otherStorage.removeItem("milan_token");
    otherStorage.removeItem("milan_token_type");
    otherStorage.removeItem("milan_user");

    storage.setItem("milan_token", token);
    storage.setItem("milan_token_type", data.token_type || "bearer");
    storage.setItem("milan_user", JSON.stringify(meData));
    onLoginSuccess?.(meData);
  };

  const submitRegister = async () => {
    if (form.password.length < 6) {
      throw new Error("Password must contain at least 6 characters.");
    }
    if (form.password !== form.confirmPassword) {
      throw new Error("Password and confirm password do not match.");
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || "Unable to create your Milan account.");
    }

    setMode("login");
    setForm((current) => ({ ...emptyForm, email: current.email, remember: true }));
    setMessage("Account created successfully. You can sign in now.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (isRegister) await submitRegister();
      else await submitLogin();
    } catch (submitError) {
      setError(submitError.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`milan-auth ${role === "vendor" ? "is-vendor" : "is-customer"}`}>
      <section className="milan-auth-story" aria-label="Milan wedding welcome">
        <button type="button" className="milan-auth-logo" onClick={onClose}>
          Milan<span>•</span>
        </button>

        <div className="milan-auth-mandala" aria-hidden="true">
          <img src={milanRoyalMandala} alt="" />
        </div>

        <div className="milan-auth-divider" aria-hidden="true">
          <i /><i /><i />
        </div>

      </section>

      <section className="milan-auth-panel">
        <button type="button" className="milan-auth-back" onClick={onClose}>
          ← Back to home
        </button>

        <div className="milan-auth-card">
          <p className="milan-auth-eyebrow">{isRegister ? "JOIN MILAN" : "WELCOME BACK"}</p>
          <h2>
            {isRegister
              ? <>Begin your <em>Milan story.</em></>
              : role === "vendor"
                ? <>Welcome back, <em>professional.</em></>
                : <>Welcome back.</>}
          </h2>
          <p className="milan-auth-intro">
            {isRegister
              ? `Create your ${role} account to begin.`
              : role === "vendor"
                ? "Manage your business and connect with couples."
                : "Sign in to continue your wedding journey."}
          </p>

          <div className="milan-auth-role-switch" role="tablist" aria-label="Choose account type">
            <button type="button" role="tab" aria-selected={role === "customer"} onClick={() => changeRole("customer")}>
              <span>♙</span><b>Customer</b><small>Planning a wedding</small>
            </button>
            <button type="button" role="tab" aria-selected={role === "vendor"} onClick={() => changeRole("vendor")}>
              <span>♜</span><b>Vendor</b><small>Wedding professional</small>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="milan-auth-form-row">
                <label>
                  <span>Full name</span>
                  <input name="full_name" value={form.full_name} onChange={updateField} placeholder="Your full name" autoComplete="name" required />
                </label>
                <label>
                  <span>Phone number</span>
                  <input name="phone" value={form.phone} onChange={updateField} placeholder="10-digit number" autoComplete="tel" inputMode="tel" required />
                </label>
              </div>
            )}

            <label>
              <span>Email address</span>
              <input type="email" name="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required />
            </label>

            <label>
              <span>Password</span>
              <span className="milan-auth-password">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder={isRegister ? "Minimum 6 characters" : "Enter your password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength="6"
                  required
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>

            {isRegister && (
              <label>
                <span>Confirm password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={updateField}
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  minLength="6"
                  required
                />
              </label>
            )}

            {!isRegister && (
              <div className="milan-auth-options">
                <label><input type="checkbox" name="remember" checked={form.remember} onChange={updateField} /><span>Remember me</span></label>
                <button type="button" onClick={() => setMessage("Password reset will be available after the reset API is connected.")}>Forgot password?</button>
              </div>
            )}

            {(error || message) && (
              <p className={`milan-auth-status ${error ? "is-error" : "is-success"}`} role="status">
                {error || message}
              </p>
            )}

            <button className="milan-auth-submit" type="submit" disabled={loading}>
              <span>{loading ? "Please wait..." : isRegister ? `Create ${role} account` : `Sign in as ${role}`}</span><b>→</b>
            </button>
          </form>

          <p className="milan-auth-change-mode">
            {isRegister ? "Already have an account?" : "New to Milan?"}{" "}
            <button type="button" onClick={() => changeMode(isRegister ? "login" : "register")}>
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
