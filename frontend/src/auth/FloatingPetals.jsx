import { motion } from "framer-motion";

const petals = [
  {
    left: "4%",
    delay: 0,
    duration: 11,
    size: 18,
    drift: 28,
    rotate: 280,
    opacity: 0.55,
  },
  {
    left: "12%",
    delay: 2.3,
    duration: 13,
    size: 13,
    drift: -24,
    rotate: -320,
    opacity: 0.4,
  },
  {
    left: "21%",
    delay: 4.1,
    duration: 12,
    size: 16,
    drift: 34,
    rotate: 360,
    opacity: 0.5,
  },
  {
    left: "31%",
    delay: 1.4,
    duration: 14,
    size: 11,
    drift: -20,
    rotate: -250,
    opacity: 0.35,
  },
  {
    left: "42%",
    delay: 5.2,
    duration: 12.5,
    size: 15,
    drift: 26,
    rotate: 310,
    opacity: 0.45,
  },
  {
    left: "53%",
    delay: 0.8,
    duration: 13.5,
    size: 12,
    drift: -30,
    rotate: -340,
    opacity: 0.42,
  },
  {
    left: "64%",
    delay: 3.6,
    duration: 11.5,
    size: 17,
    drift: 30,
    rotate: 300,
    opacity: 0.52,
  },
  {
    left: "74%",
    delay: 6,
    duration: 14,
    size: 12,
    drift: -25,
    rotate: -290,
    opacity: 0.38,
  },
  {
    left: "84%",
    delay: 1.9,
    duration: 12.8,
    size: 15,
    drift: 23,
    rotate: 330,
    opacity: 0.48,
  },
  {
    left: "94%",
    delay: 4.7,
    duration: 13.8,
    size: 13,
    drift: -28,
    rotate: -350,
    opacity: 0.4,
  },
];

const goldenParticles = [
  {
    left: "9%",
    top: "18%",
    delay: 0,
  },
  {
    left: "24%",
    top: "74%",
    delay: 1.2,
  },
  {
    left: "38%",
    top: "25%",
    delay: 0.6,
  },
  {
    left: "58%",
    top: "78%",
    delay: 1.8,
  },
  {
    left: "73%",
    top: "20%",
    delay: 0.4,
  },
  {
    left: "88%",
    top: "65%",
    delay: 1.4,
  },
];

function FloatingPetals() {
  return (
    <div
      className="floating-wedding-elements"
      aria-hidden="true"
    >

      {/* =====================================================
          FALLING ROSE PETALS
      ===================================================== */}

      {petals.map((petal, index) => (
        <motion.span
          key={`rose-petal-${index}`}
          className={`floating-petal floating-petal-${index + 1}`}
          style={{
            left: petal.left,
            width: `${petal.size}px`,
            height: `${petal.size * 0.75}px`,
          }}
          initial={{
            y: "-12vh",
            x: 0,
            rotate: 0,
            opacity: 0,
          }}
          animate={{
            y: "115vh",

            x: [
              0,
              petal.drift,
              petal.drift * -0.45,
              petal.drift * 0.7,
              0,
            ],

            rotate: [
              0,
              petal.rotate * 0.3,
              petal.rotate * 0.6,
              petal.rotate,
            ],

            opacity: [
              0,
              petal.opacity,
              petal.opacity,
              petal.opacity * 0.8,
              0,
            ],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            repeatDelay: 0.8,
            ease: "linear",
          }}
        />
      ))}


      {/* =====================================================
          SUBTLE GOLDEN PARTICLES
      ===================================================== */}

      {goldenParticles.map((particle, index) => (
        <motion.span
          key={`gold-particle-${index}`}
          className="gold-particle"
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [
              0,
              -10,
              3,
              0,
            ],

            x: [
              0,
              5,
              -3,
              0,
            ],

            scale: [
              0.8,
              1.25,
              0.9,
              0.8,
            ],

            opacity: [
              0.2,
              0.75,
              0.35,
              0.2,
            ],
          }}
          transition={{
            duration: 4.5 + index * 0.35,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

    </div>
  );
}

export default FloatingPetals;