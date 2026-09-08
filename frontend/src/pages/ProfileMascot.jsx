import { motion } from "framer-motion";

function ProfileMascot({ state = "normal" }) {
  const messages = {
    normal: "Let's make your profile perfect! ♡",
    name: "Your name looks lovely! ♡",
    phone: "Keeping your contact updated! ✨",
    address: "Hmm... let me find this place!",
    location: "Finding your perfect location!",
    pin: "Almost there!",
    success: "Profile saved! Looking amazing! 🎉",
    error: "Oops! Check that once more.",
  };

  return (
    <div className={`milan-mascot mascot-${state}`}>

      <motion.div
        className="milan-elephant-wrapper"
        animate={
          state === "success"
            ? {
              y: [0, -12, 0],
              rotate: [0, -3, 3, 0],
            }
            : {
              y: [0, -3, 0],
            }
        }
        transition={{
          duration: state === "success" ? 0.7 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >

        <svg
          className="milan-real-elephant"
          viewBox="0 0 400 430"
          xmlns="http://www.w3.org/2000/svg"
        >

          <defs>

            <radialGradient id="skin" cx="45%" cy="30%">
              <stop offset="0%" stopColor="#faf7f5" />
              <stop offset="55%" stopColor="#ddd6d3" />
              <stop offset="100%" stopColor="#b9aeaa" />
            </radialGradient>

            <radialGradient id="earSkin">
              <stop offset="0%" stopColor="#f6cdd2" />
              <stop offset="70%" stopColor="#d8aaaF" />
              <stop offset="100%" stopColor="#b78d91" />
            </radialGradient>

            <linearGradient
              id="outfit"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#7d1238" />
              <stop offset="55%" stopColor="#a51f4c" />
              <stop offset="100%" stopColor="#5e0927" />
            </linearGradient>

            <linearGradient
              id="gold"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#fff0a8" />
              <stop offset="45%" stopColor="#d9a83e" />
              <stop offset="100%" stopColor="#8d5e12" />
            </linearGradient>

            <filter id="shadow">
              <feDropShadow
                dx="0"
                dy="12"
                stdDeviation="10"
                floodOpacity="0.2"
              />
            </filter>

          </defs>


          {/* SHADOW */}

          <ellipse
            cx="200"
            cy="398"
            rx="115"
            ry="18"
            fill="rgba(70,35,40,.12)"
          />


          {/* LEFT EAR */}

          <motion.path
            d="
              M118 115
              C55 75 25 125 43 193
              C55 241 95 253 130 210
              C146 190 146 142 118 115
            "
            fill="url(#skin)"
            stroke="#aaa09d"
            strokeWidth="3"
            animate={{
              rotate:
                state === "name"
                  ? [-2, -8, -2]
                  : [-1, 2, -1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            style={{
              transformOrigin: "120px 145px",
            }}
          />

          <path
            d="
              M106 132
              C65 105 52 140 62 184
              C70 215 94 221 117 194
              C130 177 128 148 106 132
            "
            fill="url(#earSkin)"
            opacity=".8"
          />


          {/* RIGHT EAR */}

          <motion.path
            d="
              M282 115
              C345 75 375 125 357 193
              C345 241 305 253 270 210
              C254 190 254 142 282 115
            "
            fill="url(#skin)"
            stroke="#aaa09d"
            strokeWidth="3"
            animate={{
              rotate:
                state === "name"
                  ? [2, 8, 2]
                  : [1, -2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            style={{
              transformOrigin: "280px 145px",
            }}
          />

          <path
            d="
              M294 132
              C335 105 348 140 338 184
              C330 215 306 221 283 194
              C270 177 272 148 294 132
            "
            fill="url(#earSkin)"
            opacity=".8"
          />


          {/* BODY */}

          <path
            d="
              M128 265
              C130 215 165 196 200 196
              C235 196 270 215 272 265
              L285 354
              C286 385 255 398 200 398
              C145 398 114 385 115 354
              Z
            "
            fill="url(#skin)"
            filter="url(#shadow)"
          />


          {/* WEDDING JACKET */}

          <path
            d="
              M132 274
              C153 250 174 245 200 247
              C226 245 247 250 268 274
              L274 344
              C250 360 225 367 200 367
              C175 367 150 360 126 344
              Z
            "
            fill="url(#outfit)"
          />

          <path
            d="
              M139 282
              C158 267 178 261 200 262
              C222 261 242 267 261 282
            "
            fill="none"
            stroke="url(#gold)"
            strokeWidth="5"
          />


          {/* HEAD */}

          <path
            d="
              M125 152
              C128 86 161 57 200 57
              C239 57 272 86 275 152
              C278 220 245 257 200 257
              C155 257 122 220 125 152
            "
            fill="url(#skin)"
            stroke="#aaa09d"
            strokeWidth="2"
            filter="url(#shadow)"
          />


          {/* EYES */}

          <g className="elephant-svg-eyes">

            <ellipse
              cx="167"
              cy="145"
              rx="19"
              ry="24"
              fill="#fff"
            />

            <ellipse
              cx="233"
              cy="145"
              rx="19"
              ry="24"
              fill="#fff"
            />

            <motion.circle
              cx="170"
              cy="149"
              r="12"
              fill="#3c251d"
              animate={
                state === "address"
                  ? { cx: 176 }
                  : { cx: 170 }
              }
            />

            <motion.circle
              cx="230"
              cy="149"
              r="12"
              fill="#3c251d"
              animate={
                state === "address"
                  ? { cx: 236 }
                  : { cx: 230 }
              }
            />

            <circle
              cx="174"
              cy="144"
              r="4"
              fill="white"
            />

            <circle
              cx="234"
              cy="144"
              r="4"
              fill="white"
            />

          </g>


          {/* CHEEKS */}

          <ellipse
            cx="148"
            cy="184"
            rx="20"
            ry="10"
            fill="#e89ca8"
            opacity={
              state === "name"
                ? ".65"
                : ".3"
            }
          />

          <ellipse
            cx="252"
            cy="184"
            rx="20"
            ry="10"
            fill="#e89ca8"
            opacity={
              state === "name"
                ? ".65"
                : ".3"
            }
          />


          {/* TRUNK */}

          <motion.path
            d="
              M190 180
              C190 220 188 266 208 286
              C229 306 259 291 257 267
            "
            fill="none"
            stroke="url(#skin)"
            strokeWidth="31"
            strokeLinecap="round"
            animate={
              state === "success"
                ? {
                  rotate: [
                    0,
                    -15,
                    8,
                    0,
                  ],
                }
                : {
                  rotate: [
                    -1,
                    2,
                    -1,
                  ],
                }
            }
            transition={{
              duration:
                state === "success"
                  ? 0.7
                  : 3,

              repeat: Infinity,
            }}
            style={{
              transformOrigin:
                "200px 185px",
            }}
          />


          {/* SMILE */}

          <motion.path
            d="M177 210 Q200 229 223 210"
            fill="none"
            stroke="#70484a"
            strokeWidth="5"
            strokeLinecap="round"
            animate={{
              scaleX:
                state === "name" ||
                  state === "success"
                  ? 1.2
                  : 1,
            }}
            style={{
              transformOrigin:
                "200px 215px",
            }}
          />


          {/* HAT */}

          <path
            d="
              M155 76
              Q200 34 245 76
              L235 99
              Q200 85 165 99
              Z
            "
            fill="url(#outfit)"
          />

          <path
            d="M158 82 Q200 67 242 82"
            fill="none"
            stroke="url(#gold)"
            strokeWidth="5"
          />

          <text
            x="200"
            y="79"
            textAnchor="middle"
            fill="#f3d77a"
            fontFamily="Georgia"
            fontSize="16"
            fontWeight="bold"
          >
            Milan
          </text>


          {/* NECKLACE */}

          <path
            d="
              M165 251
              Q200 278 235 251
            "
            fill="none"
            stroke="url(#gold)"
            strokeWidth="5"
          />

          <circle
            cx="200"
            cy="273"
            r="14"
            fill="url(#gold)"
          />

          <text
            x="200"
            y="279"
            textAnchor="middle"
            fontSize="18"
            fill="#8b2446"
          >
            ♡
          </text>


          {/* ADDRESS MAGNIFYING GLASS */}

          {state === "address" && (
            <motion.g
              initial={{
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
            >
              <circle
                cx="300"
                cy="230"
                r="26"
                fill="none"
                stroke="#c69b3c"
                strokeWidth="8"
              />

              <line
                x1="319"
                y1="249"
                x2="344"
                y2="275"
                stroke="#8c5c28"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </motion.g>
          )}


          {/* PHONE SPARKLES */}

          {state === "phone" && (
            <motion.g
              animate={{
                opacity: [0.2, 1, 0.2],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
              }}
              fill="#e6b94d"
              fontSize="28"
            >
              <text x="85" y="125">
                ✦
              </text>

              <text x="295" y="170">
                ✦
              </text>

              <text x="95" y="255">
                ✦
              </text>
            </motion.g>
          )}


          {/* SUCCESS HEARTS */}

          {state === "success" && (
            <motion.g
              animate={{
                y: [10, -15],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
              }}
              fill="#c72d63"
              fontSize="27"
            >
              <text x="85" y="100">
                ♥
              </text>

              <text x="300" y="115">
                ♥
              </text>

              <text x="315" y="220">
                ♥
              </text>
            </motion.g>
          )}

        </svg>

      </motion.div>


      <motion.div
        className="profile-mascot-message"
        key={state}
        initial={{
          opacity: 0,
          y: 5,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >
        {messages[state] || messages.normal}
      </motion.div>

    </div>
  );
}

export default ProfileMascot;