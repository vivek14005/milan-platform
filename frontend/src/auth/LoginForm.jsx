import { useState } from "react";
import { motion } from "framer-motion";

const API_URL = "http://127.0.0.1:8000";

function LoginForm({
  onSignup,
  onLoginSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (
      !cleanEmail ||
      !password
    ) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      /* =====================================================
         FASTAPI LOGIN REQUEST
      ===================================================== */

      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  cleanEmail,

                password:
                  password,
              }),
          }
        );

      /* =====================================================
         READ RESPONSE
      ===================================================== */

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "Login response:",
        data
      );

      /* =====================================================
         HANDLE BACKEND LOGIN FAILURE
      ===================================================== */

      if (
        data.message ===
        "Invalid email or password"
      ) {
        throw new Error(
          "Invalid email or password."
        );
      }

      if (!response.ok) {
        let message =
          "Invalid email or password.";

        if (
          typeof data.detail ===
          "string"
        ) {
          message =
            data.detail;
        } else if (
          typeof data.message ===
          "string"
        ) {
          message =
            data.message;
        }

        throw new Error(
          message
        );
      }

      /* =====================================================
         JWT TOKEN
      ===================================================== */

      const token =
        data.access_token ||
        data.token ||
        data.accessToken;

      if (!token) {
        throw new Error(
          "Login successful, but no access token was returned by the server."
        );
      }

      /* =====================================================
         CHOOSE STORAGE
      ===================================================== */

      const storage =
        rememberMe
          ? localStorage
          : sessionStorage;

      const otherStorage =
        rememberMe
          ? sessionStorage
          : localStorage;

      /* =====================================================
         STORE TOKEN
      ===================================================== */

      storage.setItem(
        "milan_token",
        token
      );

      otherStorage.removeItem(
        "milan_token"
      );

      /* =====================================================
         STORE TOKEN TYPE
      ===================================================== */

      if (data.token_type) {
        storage.setItem(
          "milan_token_type",
          data.token_type
        );

        otherStorage.removeItem(
          "milan_token_type"
        );
      }

      /* =====================================================
         VERIFY TOKEN USING /auth/me
      ===================================================== */

      const meResponse =
        await fetch(
          `${API_URL}/auth/me`,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      let verifiedUser =
        null;

      if (meResponse.ok) {
        verifiedUser =
          await meResponse.json();

        console.log(
          "Verified user:",
          verifiedUser
        );
      }

      /* =====================================================
         FINAL USER OBJECT

         Login response se full_name mil raha hai.
         /auth/me se verified id/email/role mil raha hai.
      ===================================================== */

      const loggedInUser = {
        user_id:
          verifiedUser?.user_id ||
          data.user_id,

        full_name:
          data.full_name ||
          "Milan User",

        email:
          verifiedUser?.email ||
          data.email ||
          cleanEmail,

        role:
          verifiedUser?.role ||
          data.role ||
          "customer",
      };

      /* =====================================================
         STORE USER
      ===================================================== */

      storage.setItem(
        "milan_user",
        JSON.stringify(
          loggedInUser
        )
      );

      otherStorage.removeItem(
        "milan_user"
      );

      console.log(
        "Logged in user:",
        loggedInUser
      );

      /* =====================================================
         SUCCESS MESSAGE
      ===================================================== */

      setSuccess(
        "Login successful! Welcome to Milan."
      );

      setPassword("");

      /* =====================================================
         SEND LOGIN INFO TO APP

         Thoda delay rakha hai taaki success message
         ek moment ke liye dikhe.
      ===================================================== */

      setTimeout(() => {
        if (
          typeof onLoginSuccess ===
          "function"
        ) {
          onLoginSuccess(
            loggedInUser
          );
        }
      }, 800);

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      if (
        error instanceof
        TypeError &&
        error.message
          .toLowerCase()
          .includes("fetch")
      ) {
        setError(
          "Backend server is not reachable. Please make sure FastAPI is running."
        );
      } else {
        setError(
          error.message ||
          "Something went wrong while logging in."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleLogin =
    () => {
      alert(
        "Google Login will be connected later."
      );
    };

  return (
    <div className="auth-form-card">

      {/* =================================================
          BRAND
      ================================================= */}

      <motion.div
        className="form-brand"
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
        }}
      >
        <div className="form-brand-logo">
          M
        </div>

        <span>
          Milan
        </span>
      </motion.div>


      {/* =================================================
          FORM HEADER
      ================================================= */}

      <motion.div
        className="auth-form-heading"
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.08,
        }}
      >
        <div className="form-mini-label">
          WELCOME BACK
        </div>

        <h1>
          Continue Your
          <br />

          <span>
            Wedding Journey
          </span>
        </h1>

        <p>
          Login to continue planning
          your perfect celebration.
        </p>
      </motion.div>


      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <motion.div
          className="auth-message auth-error-message"
          initial={{
            opacity: 0,
            y: -8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          ⚠ {error}
        </motion.div>
      )}


      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {success && (
        <motion.div
          className="auth-message auth-success-message"
          initial={{
            opacity: 0,
            y: -8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          ✓ {success}
        </motion.div>
      )}


      {/* =================================================
          LOGIN FORM
      ================================================= */}

      <form
        className="auth-form"
        onSubmit={handleLogin}
      >

        {/* ================= EMAIL ================= */}

        <motion.div
          className="floating-field"
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.14,
          }}
        >
          <span className="floating-icon">
            ✉
          </span>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(
                e.target.value
              );

              setError("");
              setSuccess("");
            }}
            placeholder=" "
            autoComplete="email"
            disabled={loading}
            required
          />

          <label htmlFor="login-email">
            Email Address
          </label>
        </motion.div>


        {/* ================= PASSWORD ================= */}

        <motion.div
          className="floating-field"
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.2,
          }}
        >
          <span className="floating-icon">
            🔒
          </span>

          <input
            id="login-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(e) => {
              setPassword(
                e.target.value
              );

              setError("");
              setSuccess("");
            }}
            placeholder=" "
            autoComplete="current-password"
            disabled={loading}
            required
          />

          <label htmlFor="login-password">
            Password
          </label>

          <button
            type="button"
            className="floating-password-toggle"
            onClick={() =>
              setShowPassword(
                (previous) =>
                  !previous
              )
            }
            disabled={loading}
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword
              ? "🙈"
              : "👁️"}
          </button>
        </motion.div>


        {/* =================================================
            OPTIONS
        ================================================= */}

        <motion.div
          className="auth-options"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.4,
            delay: 0.26,
          }}
        >
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={
                rememberMe
              }
              onChange={(e) =>
                setRememberMe(
                  e.target.checked
                )
              }
              disabled={loading}
            />

            <span className="custom-checkbox">
              ✓
            </span>

            <span>
              Remember me
            </span>
          </label>


          <button
            type="button"
            className="auth-text-button"
            onClick={() =>
              alert(
                "Forgot Password will be added later."
              )
            }
          >
            Forgot Password?
          </button>
        </motion.div>


        {/* =================================================
            LOGIN BUTTON
        ================================================= */}

        <motion.button
          type="submit"
          className="auth-primary-button"
          disabled={loading}
          whileHover={
            loading
              ? {}
              : {
                y: -2,
                scale: 1.01,
              }
          }
          whileTap={
            loading
              ? {}
              : {
                scale: 0.985,
              }
          }
          transition={{
            duration: 0.18,
          }}
        >
          {loading ? (
            <>
              <span className="auth-spinner"></span>

              Signing In...
            </>
          ) : (
            <>
              Login

              <span className="button-arrow">
                →
              </span>
            </>
          )}
        </motion.button>

      </form>


      {/* =================================================
          DIVIDER
      ================================================= */}

      <div className="auth-divider">
        <span>
          or continue with
        </span>
      </div>


      {/* =================================================
          GOOGLE
      ================================================= */}

      <motion.button
        type="button"
        className="google-auth-button"
        onClick={
          handleGoogleLogin
        }
        whileHover={{
          y: -2,
        }}
        whileTap={{
          scale: 0.99,
        }}
      >
        <span className="google-icon">
          G
        </span>

        Continue with Google
      </motion.button>


      {/* =================================================
          SIGN UP
      ================================================= */}

      <div className="auth-switch-text">
        <span>
          Don't have an account?
        </span>

        <button
          type="button"
          onClick={onSignup}
        >
          Sign Up
        </button>
      </div>


      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="auth-form-footer">
        <span>
          By continuing, you agree to Milan's
        </span>

        <div>
          <button type="button">
            Terms
          </button>

          <span>
            •
          </span>

          <button type="button">
            Privacy Policy
          </button>
        </div>
      </div>

    </div>
  );
}

export default LoginForm;