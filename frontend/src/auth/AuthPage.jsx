import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import WeddingPanel from "./WeddingPanel";
import FloatingPetals from "./FloatingPetals";

import "./Auth.css";

function AuthPage({ onClose, onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <main
      className={`auth-page ${isSignup ? "signup-mode" : "login-mode"
        }`}
    >

      {/* Background wedding animation */}
      <FloatingPetals />

      {/* Close Authentication */}
      <button
        type="button"
        className="auth-close"
        onClick={onClose}
        aria-label="Return to Milan home page"
      >
        ×
      </button>

      <div className="auth-shell">

        {/* =================================================
            LOGIN FORM SIDE
        ================================================= */}

        <motion.section
          className="auth-form-section auth-login-section"
          animate={{
            opacity: isSignup ? 0 : 1,
            x: isSignup ? -60 : 0,
            pointerEvents: isSignup ? "none" : "auto",
          }}
          transition={{
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <AnimatePresence mode="wait">

            {!isSignup && (
              <motion.div
                key="login-form"
                className="auth-form-wrapper"
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                }}
                transition={{
                  duration: 0.5,
                }}
              >

                <LoginForm
                  onSignup={() =>
                    setIsSignup(true)
                  }
                  onLoginSuccess={onLoginSuccess}
                />

              </motion.div>
            )}

          </AnimatePresence>
        </motion.section>


        {/* =================================================
            WEDDING VISUAL PANEL
        ================================================= */}

        <motion.section
          className="auth-wedding-section"
          animate={{
            x: isSignup
              ? "-100%"
              : "0%",
          }}
          transition={{
            duration: 0.85,
            ease: [0.22, 1, 0.36, 1],
          }}
        >

          <WeddingPanel
            isSignup={isSignup}
            onLogin={() =>
              setIsSignup(false)
            }
            onSignup={() =>
              setIsSignup(true)
            }
          />

        </motion.section>


        {/* =================================================
            SIGN UP FORM SIDE
        ================================================= */}

        <motion.section
          className="auth-form-section auth-signup-section"
          animate={{
            opacity: isSignup ? 1 : 0,
            x: isSignup ? "0%" : 60,
            pointerEvents:
              isSignup
                ? "auto"
                : "none",
          }}
          transition={{
            duration: 0.65,
            delay: isSignup
              ? 0.15
              : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
        >

          <AnimatePresence mode="wait">

            {isSignup && (
              <motion.div
                key="signup-form"
                className="auth-form-wrapper"
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                }}
                transition={{
                  duration: 0.5,
                }}
              >

                <SignupForm
                  onLogin={() =>
                    setIsSignup(false)
                  }
                />

              </motion.div>
            )}

          </AnimatePresence>

        </motion.section>

      </div>


      {/* =================================================
          MOBILE BRANDING
      ================================================= */}

      <div className="auth-mobile-brand">

        <span className="auth-mobile-logo">
          Milan
        </span>

        <span className="auth-mobile-tagline">
          Your Perfect Wedding Starts Here
        </span>

      </div>

    </main>
  );
}

export default AuthPage;