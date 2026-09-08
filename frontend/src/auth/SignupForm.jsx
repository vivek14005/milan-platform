import { useState } from "react";
import { motion } from "framer-motion";

const API_URL = "http://127.0.0.1:8000";

function SignupForm({ onLogin }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  /* =========================================================
     FASTAPI ERROR FORMATTER
  ========================================================= */

  const getErrorMessage = (data) => {
    if (!data) {
      return "Account creation failed.";
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          const field =
            Array.isArray(item?.loc) &&
              item.loc.length > 0
              ? item.loc[item.loc.length - 1]
              : "";

          const message =
            item?.msg || "Invalid value";

          if (field) {
            return `${field}: ${message}`;
          }

          return message;
        })
        .join(" | ");
    }

    if (
      data.detail &&
      typeof data.detail === "object"
    ) {
      try {
        return JSON.stringify(data.detail);
      } catch {
        return "Invalid information was submitted.";
      }
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    return "Account creation failed.";
  };

  /* =========================================================
     SIGN UP
  ========================================================= */

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanName =
      formData.fullName.trim();

    const cleanEmail =
      formData.email
        .trim()
        .toLowerCase();

    const cleanPhone =
      formData.phone.trim();

    /* =====================================================
       FRONTEND VALIDATION
    ===================================================== */

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPhone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError(
        "Please fill all the fields."
      );

      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    if (
      formData.password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError(
        "Please enter a valid 10-digit phone number."
      );

      return;
    }

    try {
      setLoading(true);

      /* =====================================================
         DATA SENT TO FASTAPI
      ===================================================== */

      const payload = {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: formData.password,
        role: formData.role,
      };

      console.log(
        "Signup payload:",
        payload
      );

      /* =====================================================
         REGISTER REQUEST
      ===================================================== */

      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(payload),
        }
      );

      /* =====================================================
         READ BACKEND RESPONSE
      ===================================================== */

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "Register response status:",
        response.status
      );

      console.log(
        "Register response:",
        data
      );

      /* =====================================================
         DUPLICATE EMAIL CHECK

         Backend currently returns message with 200 response.
         Therefore we check the message manually.
      ===================================================== */

      if (
        data.message ===
        "This email is already registered. Please login instead."
      ) {
        throw new Error(
          "This email is already registered. Please login instead."
        );
      }

      /* =====================================================
         DUPLICATE PHONE CHECK
      ===================================================== */

      if (
        data.message ===
        "This phone number is already registered."
      ) {
        throw new Error(
          "This phone number is already registered."
        );
      }

      /* =====================================================
         OTHER BACKEND ERRORS
      ===================================================== */

      if (!response.ok) {
        const message =
          getErrorMessage(data);

        throw new Error(message);
      }

      /* =====================================================
         MAKE SURE ACCOUNT WAS REALLY CREATED
      ===================================================== */

      if (
        data.message !==
        "User Registered Successfully"
      ) {
        throw new Error(
          data.message ||
          "Account creation failed."
        );
      }

      /* =====================================================
         SUCCESS
      ===================================================== */

      console.log(
        "Registered user:",
        data
      );

      setSuccess(
        "Account created successfully! You can now login."
      );

      /* Clear form */

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "customer",
      });

      /* =====================================================
         SWITCH TO LOGIN AFTER SUCCESS
      ===================================================== */

      setTimeout(() => {
        onLogin();
      }, 1500);

    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      if (
        error instanceof TypeError &&
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
          "Something went wrong while creating your account."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     COMMON ANIMATION
  ========================================================= */

  const fieldAnimation = {
    initial: {
      opacity: 0,
      y: 18,
    },

    animate: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="auth-form-card signup-form-card">

      {/* =====================================================
          BRAND
      ===================================================== */}

      <motion.div
        className="form-brand"
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
      >
        <div className="form-brand-logo">
          M
        </div>

        <span>
          Milan
        </span>
      </motion.div>


      {/* =====================================================
          HEADING
      ===================================================== */}

      <motion.div
        className="auth-form-heading signup-heading"
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
          delay: 0.05,
        }}
      >
        <div className="form-mini-label">
          BEGIN YOUR JOURNEY
        </div>

        <h1>
          Join
          <span> Milan</span>
        </h1>

        <p>
          Create your account and begin planning
          your dream wedding.
        </p>
      </motion.div>


      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

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


      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

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


      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        className="auth-form signup-form"
        onSubmit={handleSignup}
      >

        {/* =================================================
            FULL NAME
        ================================================= */}

        <motion.div
          className="floating-field"
          {...fieldAnimation}
          transition={{
            duration: 0.4,
            delay: 0.1,
          }}
        >
          <span className="floating-icon">
            ♡
          </span>

          <input
            id="signup-name"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder=" "
            autoComplete="name"
            disabled={loading}
            required
          />

          <label htmlFor="signup-name">
            Full Name
          </label>
        </motion.div>


        {/* =================================================
            EMAIL
        ================================================= */}

        <motion.div
          className="floating-field"
          {...fieldAnimation}
          transition={{
            duration: 0.4,
            delay: 0.15,
          }}
        >
          <span className="floating-icon">
            ✉
          </span>

          <input
            id="signup-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder=" "
            autoComplete="email"
            disabled={loading}
            required
          />

          <label htmlFor="signup-email">
            Email Address
          </label>
        </motion.div>


        {/* =================================================
            PHONE
        ================================================= */}

        <motion.div
          className="floating-field"
          {...fieldAnimation}
          transition={{
            duration: 0.4,
            delay: 0.2,
          }}
        >
          <span className="floating-icon">
            ☎
          </span>

          <input
            id="signup-phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder=" "
            autoComplete="tel"
            inputMode="numeric"
            maxLength="10"
            disabled={loading}
            required
          />

          <label htmlFor="signup-phone">
            Phone Number
          </label>
        </motion.div>


        {/* =================================================
            PASSWORD
        ================================================= */}

        <motion.div
          className="floating-field"
          {...fieldAnimation}
          transition={{
            duration: 0.4,
            delay: 0.25,
          }}
        >
          <span className="floating-icon">
            🔒
          </span>

          <input
            id="signup-password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={
              formData.password
            }
            onChange={handleChange}
            placeholder=" "
            autoComplete="new-password"
            disabled={loading}
            required
          />

          <label htmlFor="signup-password">
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
            CONFIRM PASSWORD
        ================================================= */}

        <motion.div
          className="floating-field"
          {...fieldAnimation}
          transition={{
            duration: 0.4,
            delay: 0.3,
          }}
        >
          <span className="floating-icon">
            🔒
          </span>

          <input
            id="signup-confirm-password"
            name="confirmPassword"
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            value={
              formData.confirmPassword
            }
            onChange={handleChange}
            placeholder=" "
            autoComplete="new-password"
            disabled={loading}
            required
          />

          <label htmlFor="signup-confirm-password">
            Confirm Password
          </label>

          <button
            type="button"
            className="floating-password-toggle"
            onClick={() =>
              setShowConfirmPassword(
                (previous) =>
                  !previous
              )
            }
            disabled={loading}
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
          >
            {showConfirmPassword
              ? "🙈"
              : "👁️"}
          </button>
        </motion.div>


        {/* =================================================
            ROLE
        ================================================= */}

        <motion.div
          className="role-section"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.35,
          }}
        >
          <p className="role-title">
            I am a
          </p>

          <div className="role-selector">

            {/* CUSTOMER */}

            <button
              type="button"
              className={
                formData.role ===
                  "customer"
                  ? "role-option active"
                  : "role-option"
              }
              onClick={() => {
                setFormData(
                  (previous) => ({
                    ...previous,
                    role: "customer",
                  })
                );

                setError("");
              }}
              disabled={loading}
            >
              <span className="role-icon">
                ♡
              </span>

              <div>
                <strong>
                  Customer
                </strong>

                <small>
                  Planning a wedding
                </small>
              </div>
            </button>


            {/* VENDOR */}

            <button
              type="button"
              className={
                formData.role ===
                  "vendor"
                  ? "role-option active"
                  : "role-option"
              }
              onClick={() => {
                setFormData(
                  (previous) => ({
                    ...previous,
                    role: "vendor",
                  })
                );

                setError("");
              }}
              disabled={loading}
            >
              <span className="role-icon">
                ♛
              </span>

              <div>
                <strong>
                  Vendor
                </strong>

                <small>
                  Offering services
                </small>
              </div>
            </button>

          </div>
        </motion.div>


        {/* =================================================
            CREATE ACCOUNT
        ================================================= */}

        <motion.button
          type="submit"
          className="auth-primary-button signup-submit-button"
          disabled={loading}
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.4,
          }}
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
        >
          {loading ? (
            <>
              <span className="auth-spinner"></span>

              Creating Account...
            </>
          ) : (
            <>
              Create Account

              <span className="button-arrow">
                →
              </span>
            </>
          )}
        </motion.button>

      </form>


      {/* =====================================================
          LOGIN SWITCH
      ===================================================== */}

      <div className="auth-switch-text signup-switch">
        <span>
          Already have an account?
        </span>

        <button
          type="button"
          onClick={onLogin}
        >
          Login
        </button>
      </div>


      {/* =====================================================
          TERMS
      ===================================================== */}

      <div className="auth-form-footer signup-footer">
        <span>
          By creating an account, you agree to Milan's
        </span>

        <div>
          <button type="button">
            Terms
          </button>

          <span>•</span>

          <button type="button">
            Privacy Policy
          </button>
        </div>
      </div>

    </div>
  );
}

export default SignupForm;