import { useState } from "react";
import "./Login.css";

function Login({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Next step:
    // Yahan FastAPI /auth/login API connect hogi
    // aur backend PostgreSQL se user verify karega.

    console.log({
      email,
      password,
      rememberMe,
    });

    alert("Login backend connection next step mein add karenge.");
  };

  return (
    <div className="login-page">

      {/* ================= LEFT SIDE ================= */}
      <section className="login-left">

        <div className="login-decoration decoration-one"></div>
        <div className="login-decoration decoration-two"></div>
        <div className="login-decoration decoration-three"></div>

        {/* BRAND */}
        <div className="login-brand">
          <div className="brand-mark">
            M
          </div>

          <div>
            <h2>Milan</h2>
            <p>PLAN • CELEBRATE • REMEMBER</p>
          </div>
        </div>


        {/* MAIN MESSAGE */}
        <div className="login-message">

          <div className="wedding-badge">
            ✨ Made for beautiful celebrations
          </div>

          <h1>
            Your Wedding,
            <br />
            <span>Your Way.</span>
          </h1>

          <p className="login-description">
            Discover trusted wedding vendors, beautiful venues
            and services near you — all in one elegant place.
          </p>


          {/* FEATURES */}
          <div className="login-features">

            <div className="login-feature-item">
              <div className="feature-check">✓</div>

              <div>
                <strong>Verified Vendors</strong>
                <p>
                  Connect with trusted wedding professionals.
                </p>
              </div>
            </div>


            <div className="login-feature-item">
              <div className="feature-check">✓</div>

              <div>
                <strong>Location Based Search</strong>
                <p>
                  Find wedding services near your area.
                </p>
              </div>
            </div>


            <div className="login-feature-item">
              <div className="feature-check">✓</div>

              <div>
                <strong>Simple Wedding Planning</strong>
                <p>
                  Search, compare and choose everything in one place.
                </p>
              </div>
            </div>

          </div>

        </div>


        {/* BOTTOM */}
        <div className="login-left-bottom">

          <div className="couple-mini">
            <span>👰🏻‍♀️</span>
            <span>♥</span>
            <span>🤵🏻</span>
          </div>

          <p>
            Making every celebration a little more special.
          </p>

        </div>

      </section>


      {/* ================= RIGHT SIDE ================= */}
      <section className="login-right">

        {/* CLOSE */}
        <button
          type="button"
          className="login-close"
          onClick={onClose}
          aria-label="Close login"
        >
          ×
        </button>


        <div className="login-card">

          {/* MOBILE BRAND */}
          <div className="mobile-login-brand">
            Milan
          </div>


          {/* HEADER */}
          <div className="login-heading">

            <div className="login-heading-icon">
              ♥
            </div>

            <p className="login-small-title">
              WELCOME TO MILAN
            </p>

            <h2>
              Welcome Back
            </h2>

            <p className="login-subtitle">
              Login to continue planning your perfect wedding.
            </p>

          </div>


          {/* ================= FORM ================= */}
          <form onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div className="login-field">

              <label htmlFor="login-email">
                Email Address
              </label>

              <div className="input-wrapper">

                <div className="input-icon">
                  ✉
                </div>

                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div className="login-field">

              <div className="password-label-row">

                <label htmlFor="login-password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert("Forgot Password feature next step mein add karenge.")
                  }
                >
                  Forgot Password?
                </button>

              </div>


              <div className="input-wrapper">

                <div className="input-icon">
                  🔒
                </div>

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>

              </div>

            </div>


            {/* OPTIONS */}
            <div className="login-options">

              <label className="remember-label">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />

                <span>
                  Remember me
                </span>

              </label>

            </div>


            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="login-submit"
            >
              <span>
                Login to Milan
              </span>

              <span className="login-arrow">
                →
              </span>
            </button>

          </form>


          {/* DIVIDER */}
          <div className="login-divider">
            <span>New to Milan?</span>
          </div>


          {/* CREATE ACCOUNT */}
          <button
            type="button"
            className="create-account-btn"
            onClick={() =>
              alert("Create Account page next banayenge.")
            }
          >
            Create New Account
          </button>


          {/* TERMS */}
          <div className="login-footer-text">

            <p>
              By continuing, you agree to Milan's
            </p>

            <div>
              <button type="button">
                Terms & Conditions
              </button>

              <span>and</span>

              <button type="button">
                Privacy Policy
              </button>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Login;