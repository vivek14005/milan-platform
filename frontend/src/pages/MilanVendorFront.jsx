import { useEffect, useState } from "react";
import decorPhoto from "../assets/milan-vendor-decor.webp";
import photographyPhoto from "../assets/milan-vendor-photography.webp";
import cateringPhoto from "../assets/milan-vendor-catering.webp";
import makeupPhoto from "../assets/milan-vendor-makeup.webp";
import djPhoto from "../assets/milan-vendor-dj.webp";
import hallPhoto from "../assets/milan-vendor-marriage-hall.webp";
import "./MilanVendorFront.css";

const photos = [
  { src: decorPhoto, name: "DECORATION", caption: "Beautiful spaces, thoughtfully made." },
  { src: photographyPhoto, name: "PHOTOGRAPHY", caption: "Every moment, beautifully remembered." },
  { src: cateringPhoto, name: "CATERING", caption: "Every flavour becomes a memory." },
  { src: makeupPhoto, name: "MAKEUP & BEAUTY", caption: "Made for your most special day." },
  { src: djPhoto, name: "DJ & MUSIC", caption: "The soundtrack to every celebration." },
  { src: hallPhoto, name: "MARRIAGE HALLS", caption: "A beautiful setting for your forever." },
];

export default function MilanVendorFront() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % photos.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="milan-vendor-front" id="home">
      <div className="milan-vendor-front__copy">
        <span className="milan-vendor-front__eyebrow">MILAN FOR WEDDING PROFESSIONALS</span>
        <h1>Grow Your Wedding<br /><em>Business</em> With Milan</h1>
        <p>
          Thank you for choosing Milan as a partner in your growth.
          Connect with more couples, receive genuine wedding enquiries,
          and turn new opportunities into lasting success.
        </p>
        <div className="milan-vendor-front__benefits">
          <span>✓ Reach More Couples</span>
          <span>✓ Receive Genuine Leads</span>
          <span>✓ Grow Your Business</span>
        </div>
      </div>

      <figure className="milan-vendor-front__gallery">
        <div className="milan-vendor-front__frame">
          {photos.map((photo, index) => (
            <img
              key={photo.name}
              src={photo.src}
              alt={active === index ? `${photo.name} wedding service` : ""}
              aria-hidden={active !== index}
              className={active === index ? "is-active" : ""}
            />
          ))}
        </div>
        <figcaption>
          <div>
            <small>{photos[active].name} · MILAN VENDORS</small>
            <strong>{photos[active].caption}</strong>
          </div>
          <div className="milan-vendor-front__dots" aria-label="Choose vendor photo">
            {photos.map((photo, index) => (
              <button
                key={photo.name}
                type="button"
                className={active === index ? "is-active" : ""}
                aria-label={`Show ${photo.name} photo`}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        </figcaption>
      </figure>
    </section>
  );
}
