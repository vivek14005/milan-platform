import { useEffect, useState } from "react";
import "./VendorClosing.css";

const signoffLines = [
  ["You bring the craft. They bring the dream.", "Together, we make forever beautiful."],
  ["Every detail you create holds a little magic.", "Together, we turn it into a lifetime of memories."],
  ["Behind every beautiful wedding is your dedication.", "With Milan, your work finds its people."],
  ["The moments they treasure begin with your vision.", "Let's make every celebration extraordinary."],
  ["Your passion gives every celebration its heart.", "Together, we make their story shine."],
  ["From the first idea to the final celebration.", "Your craft makes every moment matter."],
];

const vendorLines = [
  { en: "Every detail you create becomes part of their forever.", hi: "आपकी सजाई हर छोटी बात उनकी यादों का हिस्सा बन जाती है।" },
  { en: "Your work turns a place into a memory.", hi: "आपका हुनर एक जगह को खूबसूरत याद में बदल देता है।" },
  { en: "Behind every beautiful wedding is a maker who cares.", hi: "हर खूबसूरत शादी के पीछे आपका दिल से किया गया काम होता है।" },
  { en: "Your craft gives their story its own kind of magic.", hi: "आपका हुनर उनकी कहानी में एक अलग ही जादू भर देता है।" },
  { en: "The moments they remember begin with what you do.", hi: "उनके यादगार पल आपके काम से शुरू होते हैं।" },
  { en: "Every thoughtful touch makes a celebration their own.", hi: "आपका हर खास स्पर्श जश्न को उनके जैसा बना देता है।" },
  { en: "You bring more than a service. You bring a feeling.", hi: "आप सिर्फ सेवा नहीं, एक खूबसूरत एहसास भी देते हैं।" },
  { en: "Their once-in-a-lifetime day deserves your one-of-a-kind work.", hi: "उनके सबसे खास दिन को आपके अनोखे हुनर की ज़रूरत है।" },
  { en: "The best celebrations are built by people with heart.", hi: "सबसे खूबसूरत जश्न दिल से काम करने वाले लोग सजाते हैं।" },
  { en: "What you create today will be remembered for years.", hi: "आज आपका बनाया कल उनकी सबसे प्यारी याद बनेगा।" },
];

export default function VendorClosing() {
  const [activeSignoff, setActiveSignoff] = useState(0);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    const syncTimer = () => {
      window.clearInterval(timer);
      if (!motionPreference.matches && !document.hidden) {
        timer = window.setInterval(() => {
          setActiveSignoff((current) => (current + 1) % signoffLines.length);
        }, 6500);
      }
    };
    syncTimer();
    motionPreference.addEventListener?.("change", syncTimer);
    document.addEventListener("visibilitychange", syncTimer);
    return () => {
      window.clearInterval(timer);
      motionPreference.removeEventListener?.("change", syncTimer);
      document.removeEventListener("visibilitychange", syncTimer);
    };
  }, []);

  return (
    <section className="milan-vendor-closing" aria-label="A note to our wedding partners">
      <div className="milan-vendor-closing-inner">
        <span className="milan-vendor-closing-kicker">A NOTE TO OUR WEDDING PARTNERS</span>
        <div className="milan-vendor-closing-rule" aria-hidden="true" />
        <h2>
          Your craft makes
          <br />
          <em>their forever</em> unforgettable.
        </h2>
        <p className="milan-vendor-closing-intro">
          Every celebration has a story. You help make it beautiful.
        </p>
        <div className="milan-vendor-line-frame">
          <span className="milan-vendor-line-mark" aria-hidden="true">“</span>
          <div className="milan-vendor-lines" aria-label="Messages for Milan wedding professionals">
            {vendorLines.map((line, index) => (
              <div className="milan-vendor-quote" key={line.en} style={{ "--line-index": index }}>
                <p lang="en">{line.en}</p>
                <p lang="hi">{line.hi}</p>
              </div>
            ))}
          </div>
          <span className="milan-vendor-line-mark" aria-hidden="true">”</span>
        </div>
        <p className="milan-vendor-closing-signoff" aria-live="off" key={activeSignoff}>
          {signoffLines[activeSignoff][0]}
          <br />
          <span>{signoffLines[activeSignoff][1]}</span>
        </p>
        <span className="milan-vendor-closing-signature">WITH LOVE, MILAN <span aria-hidden="true">✦</span></span>
      </div>
    </section>
  );
}
