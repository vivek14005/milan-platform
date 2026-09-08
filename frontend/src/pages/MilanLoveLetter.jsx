import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function MilanLoveLetter({ userName }) {
  const [page, setPage] = useState(0);
  const firstName =
    userName?.trim().split(" ")[0] || "Milan Member";

  const letterPages = [
    {
      title: `Dear ${firstName},`,
      text:
        "Welcome to your little corner of Milan. Every beautiful celebration begins with a few meaningful details.",
    },
    {
      title: "A beautiful journey awaits...",
      text:
        "Tell us a little more about yourself, so Milan can make your wedding planning experience feel more personal.",
    },
    {
      title: "Your perfect celebration",
      text:
        "Your location helps Milan bring the right venues, photographers, decorators and wedding professionals closer to you.",
    },
    {
      title: "Made with care",
      text:
        "Every detail you add helps us understand your celebration a little better and create an experience made for you.",
    },
    {
      title: "With love,",
      text:
        "May every step of your wedding journey bring you closer to moments worth remembering.",
      signature: "Milan ♡",
    },
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setPage((current) =>
        (current + 1) % letterPages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentPage = letterPages[page];

  return (
    <div className="milan-letter-section">

      {/* Decorative glow */}

      <div className="letter-glow letter-glow-one" />
      <div className="letter-glow letter-glow-two" />


      {/* Envelope */}

      <motion.div
        className="milan-envelope"
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
        }}
      >

        {/* Back of envelope */}

        <div className="envelope-back" />


        {/* Letter paper */}

        <div className="letter-paper">

          <div className="letter-gold-line" />

          <div className="letter-small-heading">
            A NOTE FROM MILAN
          </div>


          {/* Only ONE page is visible at a time */}

          <div className="letter-page-window">

            <AnimatePresence mode="wait">

              <motion.div
                key={page}
                className="letter-page"
                initial={{
                  opacity: 0,
                  x: 25,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -25,
                  y: -5,
                }}
                transition={{
                  duration: 0.55,
                  ease: "easeInOut",
                }}
              >

                <h3>
                  {currentPage.title}
                </h3>

                <p>
                  {currentPage.text}
                </p>

                {currentPage.signature && (
                  <strong className="letter-signature">
                    {currentPage.signature}
                  </strong>
                )}

              </motion.div>

            </AnimatePresence>

          </div>


          {/* Page indicators */}

          <div className="letter-page-dots">

            {letterPages.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Open message ${index + 1}`}
                className={
                  index === page
                    ? "letter-dot active"
                    : "letter-dot"
                }
                onClick={() => setPage(index)}
              />
            ))}

          </div>

        </div>


        {/* Envelope front */}

        <div className="envelope-front-left" />
        <div className="envelope-front-right" />
        <div className="envelope-front-bottom" />


        {/* Milan wax seal */}

        <motion.div
          className="milan-wax-seal"
          whileHover={{
            scale: 1.08,
            rotate: 3,
          }}
        >
          M
        </motion.div>

      </motion.div>


      <div className="letter-bottom-text">
        <span>♡</span>
        Where Hearts Meet
        <span>♡</span>
      </div>

    </div>
  );
}

export default MilanLoveLetter;