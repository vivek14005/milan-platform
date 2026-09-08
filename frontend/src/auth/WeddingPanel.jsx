import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const blessings = [
  "May your journey together be filled with love, laughter and beautiful memories.",
  "May every new chapter of your life be more beautiful than the last.",
  "Two hearts, one journey, and a lifetime of celebrations.",
  "May your forever be filled with warmth, happiness and togetherness.",
  "With love, Milan — wishing you a beautiful beginning to your forever.",
];

function WeddingPanel({ isSignup, onLogin, onSignup }) {
  const [blessingIndex, setBlessingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlessingIndex((prev) => (prev + 1) % blessings.length);
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="wedding-panel milan-blessing-panel">

      {/* Decorative frame */}
      <div className="wedding-frame" />

      {/* Soft background glows */}
      <motion.div
        className="blessing-glow blessing-glow-one"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="blessing-glow blessing-glow-two"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.18, 0.35, 0.18],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Brand */}
      <div className="wedding-panel-brand blessing-brand">
        <motion.div
          className="wedding-brand-mark"
          animate={{
            boxShadow: [
              "0 0 0 rgba(239,217,170,0)",
              "0 0 24px rgba(239,217,170,0.22)",
              "0 0 0 rgba(239,217,170,0)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        >
          M
        </motion.div>

        <div>
          <h2>Milan</h2>
          <p>CELEBRATE LOVE</p>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="blessing-center">

        <motion.p
          className="blessing-mini-title"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          FROM MILAN, WITH LOVE
        </motion.p>

        <motion.h1
          className="blessing-main-title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          Your Story.
          <br />
          <span>Your Forever.</span>
        </motion.h1>

        <div className="blessing-quote-wrap">
          <AnimatePresence mode="wait">
            <motion.p
              key={blessingIndex}
              className="blessing-quote"
              initial={{
                opacity: 0,
                y: 16,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                y: -14,
                filter: "blur(3px)",
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              “{blessings[blessingIndex]}”
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div
          className="blessing-heart"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ♡
        </motion.div>

        <div className="blessing-signature">
          <span>With love,</span>
          <strong>Milan</strong>
        </div>

      </div>

      {/* Bottom panel copy */}
      <div className="wedding-panel-content blessing-bottom-content">

        <AnimatePresence mode="wait">
          <motion.div
            key={isSignup ? "signup-bottom" : "login-bottom"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >

            <p className="wedding-panel-small">
              {isSignup ? "BEGIN YOUR JOURNEY" : "WELCOME TO MILAN"}
            </p>

            <div className="wedding-panel-switch">
              <span>
                {isSignup
                  ? "Already part of Milan?"
                  : "Planning your special day?"}
              </span>

              <button
                type="button"
                onClick={isSignup ? onLogin : onSignup}
              >
                {isSignup ? "Login" : "Join Milan"}
              </button>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>

    </div>
  );
}

export default WeddingPanel;