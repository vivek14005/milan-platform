import { useEffect, useState } from "react";
import "./VendorDetailsPage.css";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";


function VendorDetails() {

  const navigate = useNavigate();
  const { vendorId } = useParams();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // VENDOR PUBLIC PORTFOLIO
  // =====================================================

  const [portfolioMedia, setPortfolioMedia] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState("");

  // Customer save / favourite state.
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showEnquiryForm, setShowEnquiryForm] =
    useState(false);

  const [enquiryForm, setEnquiryForm] = useState({
    customer_name: "",
    phone: "",
    wedding_date: "",
    message: "",
  });

  const [enquiryLoading, setEnquiryLoading] =
    useState(false);

  const [enquiryError, setEnquiryError] =
    useState("");

  const [enquirySuccess, setEnquirySuccess] =
    useState("");


  // =====================================================
  // REVIEWS & RATINGS
  // =====================================================

  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    average_rating: 0,
    total_reviews: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSubmitError, setReviewSubmitError] = useState("");

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError("");

      const [reviewsResponse, summaryResponse] = await Promise.all([
        fetch(`${API_URL}/reviews/vendor/${vendorId}`),
        fetch(`${API_URL}/reviews/vendor/${vendorId}/summary`),
      ]);

      const reviewsData = await reviewsResponse.json();
      const summaryData = await summaryResponse.json();

      if (!reviewsResponse.ok) {
        throw new Error(reviewsData.detail || "Unable to load reviews.");
      }

      if (!summaryResponse.ok) {
        throw new Error(summaryData.detail || "Unable to load rating summary.");
      }

      setReviews(Array.isArray(reviewsData.reviews) ? reviewsData.reviews : []);
      setReviewSummary({
        average_rating: Number(summaryData.average_rating || 0),
        total_reviews: Number(summaryData.total_reviews || 0),
      });
    } catch (err) {
      console.error("Reviews loading error:", err);
      setReviewsError(err.message || "Unable to load reviews.");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [vendorId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitError("");
    setReviewMessage("");

    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) {
      setReviewSubmitError("Please login as a customer to write a review.");
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewSubmitError("Please select a rating from 1 to 5 stars.");
      return;
    }

    try {
      setReviewSubmitting(true);

      const response = await fetch(`${API_URL}/reviews/${vendorId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          review_text: reviewText.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Unable to submit review.");
      }

      setReviewRating(0);
      setReviewText("");
      setReviewMessage("Review submitted successfully.");
      await loadReviews();
    } catch (err) {
      setReviewSubmitError(err.message || "Unable to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };


  // =====================================================
  // REGISTER PROFILE VIEW
  // =====================================================

  const registerProfileView = async () => {

    try {

      // ---------------------------------------------------
      // React development mode me useEffect kabhi-kabhi
      // 2 baar run ho sakta hai.
      //
      // Isliye 3 seconds ka protection rakha hai,
      // taaki ek hi page opening double count na ho.
      // ---------------------------------------------------

      const viewKey =
        `milan_vendor_view_${vendorId}`;

      const previousView =
        sessionStorage.getItem(viewKey);

      const currentTime = Date.now();

      if (
        previousView &&
        currentTime - Number(previousView) < 3000
      ) {
        return;
      }

      sessionStorage.setItem(
        viewKey,
        String(currentTime)
      );

      const response = await fetch(
        `${API_URL}/vendors/${vendorId}/view`,
        {
          method: "POST",

          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {

        // Profile view failure ki wajah se
        // vendor page ko block nahi karna.
        console.error(
          "Unable to register profile view."
        );

        return;
      }

      const data = await response.json();

      console.log(
        "Vendor profile view registered:",
        data
      );

    } catch (err) {

      // View tracking fail hone par bhi
      // vendor details page normal open rahega.
      console.error(
        "Profile view tracking error:",
        err
      );
    }
  };


  // =====================================================
  // LOAD VENDOR
  // =====================================================

  useEffect(() => {

    const loadVendor = async () => {

      try {

        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/vendors/${vendorId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
            "Unable to load vendor."
          );
        }

        setVendor(data.vendor);

        // =================================================
        // CUSTOMER OPENED VENDOR PROFILE
        // REGISTER ONE PROFILE VIEW
        // =================================================

        await registerProfileView();

      } catch (err) {

        setError(
          err.message ||
          "Unable to load vendor."
        );

      } finally {

        setLoading(false);

      }
    };

    loadVendor();

  }, [vendorId]);


  // =====================================================
  // LOAD VENDOR PUBLIC PORTFOLIO
  // =====================================================

  useEffect(() => {

    const loadVendorPortfolio = async () => {

      try {

        setPortfolioLoading(true);
        setPortfolioError("");

        const response = await fetch(
          `${API_URL}/vendors/${vendorId}/media`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
            "Unable to load vendor portfolio."
          );
        }

        setPortfolioMedia(
          Array.isArray(data.media)
            ? data.media
            : []
        );

      } catch (err) {

        console.error(
          "Vendor portfolio loading error:",
          err
        );

        setPortfolioError(
          err.message ||
          "Unable to load vendor portfolio."
        );

      } finally {

        setPortfolioLoading(false);

      }
    };

    loadVendorPortfolio();

  }, [vendorId]);


  // =====================================================
  // LOAD SAVED STATUS
  // =====================================================

  useEffect(() => {
    const loadSavedStatus = async () => {
      const token =
        localStorage.getItem("milan_token") ||
        sessionStorage.getItem("milan_token");

      if (!token) {
        setIsSaved(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/saved-vendors/${vendorId}/status`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          setIsSaved(false);
          return;
        }

        const data = await response.json();
        setIsSaved(Boolean(data.saved));
      } catch (err) {
        console.error("Unable to load saved vendor status:", err);
      }
    };

    loadSavedStatus();
  }, [vendorId]);

  const toggleSavedVendor = async () => {
    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    setSaveError("");

    if (!token) {
      setSaveError("Please login as a customer to save this vendor.");
      return;
    }

    try {
      setSaveLoading(true);

      const response = await fetch(
        `${API_URL}/saved-vendors/${vendorId}`,
        {
          method: isSaved ? "DELETE" : "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Unable to update saved vendor.");
      }

      setIsSaved(Boolean(data.saved));
    } catch (err) {
      setSaveError(err.message || "Unable to update saved vendor.");
    } finally {
      setSaveLoading(false);
    }
  };

  // =====================================================
  // DATE LIMITS
  // Today -> Maximum 1 year
  // =====================================================

  const today = new Date();

  const minWeddingDate =
    today.toLocaleDateString("en-CA");

  const maxWeddingDateObject = new Date();

  maxWeddingDateObject.setFullYear(
    maxWeddingDateObject.getFullYear() + 1
  );

  const maxWeddingDate =
    maxWeddingDateObject.toLocaleDateString("en-CA");


  // =====================================================
  // SEND ENQUIRY
  // =====================================================

  const handleEnquirySubmit = async (e) => {

    e.preventDefault();

    setEnquiryError("");
    setEnquirySuccess("");


    // -----------------------------------------------------
    // TOKEN
    // -----------------------------------------------------

    const token =
      localStorage.getItem("milan_token") ||
      sessionStorage.getItem("milan_token");

    if (!token) {

      setEnquiryError(
        "Please login before contacting the vendor."
      );

      return;
    }


    // -----------------------------------------------------
    // REQUIRED FIELDS
    // -----------------------------------------------------

    if (
      !enquiryForm.customer_name.trim() ||
      !enquiryForm.phone.trim()
    ) {

      setEnquiryError(
        "Please enter your name and phone number."
      );

      return;
    }


    // -----------------------------------------------------
    // CUSTOMER NAME VALIDATION
    // -----------------------------------------------------

    const cleanName =
      enquiryForm.customer_name.trim();

    if (cleanName.length < 2) {

      setEnquiryError(
        "Please enter a valid name."
      );

      return;
    }


    // -----------------------------------------------------
    // PHONE VALIDATION
    // Indian mobile number
    // Exactly 10 digits
    // Must start with 6, 7, 8 or 9
    // -----------------------------------------------------

    const cleanPhone =
      enquiryForm.phone.trim();

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {

      setEnquiryError(
        "Please enter a valid 10-digit Indian mobile number."
      );

      return;
    }


    // -----------------------------------------------------
    // WEDDING DATE VALIDATION
    // -----------------------------------------------------

    if (enquiryForm.wedding_date) {

      const selectedDate = new Date(
        `${enquiryForm.wedding_date}T00:00:00`
      );

      const todayDate = new Date();

      todayDate.setHours(
        0,
        0,
        0,
        0
      );


      // Maximum = 1 year from today

      const maximumDate = new Date();

      maximumDate.setFullYear(
        maximumDate.getFullYear() + 1
      );

      maximumDate.setHours(
        0,
        0,
        0,
        0
      );


      // Past date

      if (selectedDate < todayDate) {

        setEnquiryError(
          "Wedding date cannot be in the past."
        );

        return;
      }


      // More than 1 year

      if (selectedDate > maximumDate) {

        setEnquiryError(
          "Wedding date cannot be more than 1 year in the future."
        );

        return;
      }
    }


    // -----------------------------------------------------
    // SEND REQUEST
    // -----------------------------------------------------

    try {

      setEnquiryLoading(true);

      const response = await fetch(
        `${API_URL}/enquiries`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({

            vendor_id:
              Number(vendorId),

            customer_name:
              cleanName,

            phone:
              cleanPhone,

            wedding_date:
              enquiryForm.wedding_date || null,

            message:
              enquiryForm.message.trim() || null,

          }),
        }
      );


      const data = await response.json();


      // ---------------------------------------------------
      // BACKEND ERROR HANDLING
      // ---------------------------------------------------

      if (!response.ok) {

        let errorMessage =
          "Unable to send enquiry.";

        if (Array.isArray(data.detail)) {

          errorMessage = data.detail
            .map((item) => {

              let message =
                item.msg ||
                "Invalid value.";

              // Remove Pydantic "Value error, "
              message = message.replace(
                /^Value error,\s*/i,
                ""
              );

              return message;

            })
            .join(" ");

        } else if (
          typeof data.detail === "string"
        ) {

          errorMessage = data.detail;

        }

        throw new Error(errorMessage);
      }


      // ---------------------------------------------------
      // SUCCESS
      // ---------------------------------------------------

      setEnquirySuccess(
        "Enquiry sent successfully! The vendor can now contact you."
      );


      // Clear form

      setEnquiryForm({
        customer_name: "",
        phone: "",
        wedding_date: "",
        message: "",
      });


    } catch (err) {

      setEnquiryError(
        err.message ||
        "Unable to send enquiry."
      );

    } finally {

      setEnquiryLoading(false);

    }
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div>
        Loading vendor details...
      </div>

    );
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div>

        <h2>
          Unable to load vendor
        </h2>

        <p>
          {error}
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </div>

    );
  }


  // =====================================================
  // VENDOR NOT FOUND
  // =====================================================

  if (!vendor) {

    return (

      <div>

        <h2>
          Vendor not found
        </h2>

        <button
          type="button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </div>

    );
  }


  // =====================================================
  // VENDOR DETAILS
  // =====================================================

  return (

    <div className="vendor-details-page">


      {/* BACK BUTTON */}

      <button
        type="button"
        onClick={() => navigate("/")}
      >
        ← Back to Home
      </button>


      <div className="vendor-details-card">


        {/* VERIFIED STATUS - CUSTOMER FACING */}

        {vendor.is_verified && (
          <div
            className="vendor-details-verified-badge"
            title="This vendor has been verified by Milan"
          >
            <span
              className="vendor-details-verified-icon"
              aria-hidden="true"
            >
              ✓
            </span>

            <span>
              Verified by Milan
            </span>
          </div>
        )}


        {/* BUSINESS NAME */}

        <h1>
          {vendor.business_name}
        </h1>


        {/* CATEGORY */}

        <h3>
          {vendor.category}
        </h3>


        {/* LOCATION */}

        <p>

          📍{" "}

          {vendor.area
            ? `${vendor.area}, `
            : ""}

          {vendor.district
            ? `${vendor.district}, `
            : ""}

          {vendor.state || ""}

        </p>


        {/* ADDRESS */}

        {vendor.address && (

          <p>
            🏠 {vendor.address}
          </p>

        )}


        {/* PINCODE */}

        {vendor.pincode && (

          <p>
            📌 PIN: {vendor.pincode}
          </p>

        )}


        {/* PHONE */}

        <p>
          📞 {vendor.phone}
        </p>


        {/* DESCRIPTION */}

        {vendor.description && (

          <div>

            <h3>
              About Vendor
            </h3>

            <p>
              {vendor.description}
            </p>

          </div>

        )}


        {/* =================================================
            VENDOR PORTFOLIO
        ================================================= */}

        <div className="vendor-public-portfolio">

          <div className="vendor-portfolio-heading">
            <span>PORTFOLIO</span>
            <h2>Our Work</h2>
            <p>
              Explore photos and videos shared by {vendor.business_name}.
            </p>
          </div>

          {portfolioLoading && (
            <div className="vendor-portfolio-status">
              Loading portfolio...
            </div>
          )}

          {!portfolioLoading && portfolioError && (
            <div className="vendor-portfolio-status error">
              {portfolioError}
            </div>
          )}

          {!portfolioLoading &&
            !portfolioError &&
            portfolioMedia.length === 0 && (
              <div className="vendor-portfolio-empty">
                <div>🖼️</div>
                <h3>Portfolio coming soon</h3>
                <p>
                  This vendor has not added photos or videos yet.
                </p>
              </div>
            )}

          {!portfolioLoading &&
            !portfolioError &&
            portfolioMedia.some(
              (item) => item.media_type === "image"
            ) && (
              <div className="vendor-portfolio-block">

                <h3>Photos</h3>

                <div className="vendor-public-photo-grid">

                  {portfolioMedia
                    .filter(
                      (item) =>
                        item.media_type === "image"
                    )
                    .map((item) => (
                      <div
                        className="vendor-public-photo"
                        key={item.id}
                      >
                        <img
                          src={`${API_URL}${item.file_url}`}
                          alt={`${vendor.business_name} portfolio`}
                          loading="lazy"
                        />
                      </div>
                    ))}

                </div>

              </div>
            )}

          {!portfolioLoading &&
            !portfolioError &&
            portfolioMedia.some(
              (item) => item.media_type === "video"
            ) && (
              <div className="vendor-portfolio-block">

                <h3>Videos</h3>

                <div className="vendor-public-video-grid">

                  {portfolioMedia
                    .filter(
                      (item) =>
                        item.media_type === "video"
                    )
                    .map((item) => (
                      <div
                        className="vendor-public-video"
                        key={item.id}
                      >
                        <video
                          src={`${API_URL}${item.file_url}`}
                          controls
                          preload="metadata"
                          playsInline
                        />
                      </div>
                    ))}

                </div>

              </div>
            )}

        </div>


        {/* =================================================
            REVIEWS & RATINGS
        ================================================= */}

        <section className="vendor-reviews-section">
          <div className="vendor-reviews-heading">
            <div>
              <span>REVIEWS & RATINGS</span>
              <h2>What Couples Say</h2>
              <p>Real experiences shared by Milan customers.</p>
            </div>

            <div className="vendor-rating-summary">
              <strong>⭐ {reviewSummary.average_rating.toFixed(1)}</strong>
              <span>
                {reviewSummary.total_reviews} {reviewSummary.total_reviews === 1 ? "Review" : "Reviews"}
              </span>
            </div>
          </div>

          <form className="review-form" onSubmit={handleReviewSubmit}>
            <h3>Write a Review</h3>
            <p>Share your experience with {vendor.business_name}.</p>

            <div className="review-star-picker" aria-label="Select rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= reviewRating ? "active" : ""}
                  onClick={() => setReviewRating(star)}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
              <span>{reviewRating ? `${reviewRating}/5` : "Select rating"}</span>
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell others about your experience..."
              rows="4"
            />

            {reviewSubmitError && (
              <div className="review-feedback error">⚠ {reviewSubmitError}</div>
            )}

            {reviewMessage && (
              <div className="review-feedback success">✓ {reviewMessage}</div>
            )}

            <button type="submit" disabled={reviewSubmitting}>
              {reviewSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>

          <div className="vendor-review-list">
            {reviewsLoading && (
              <div className="vendor-review-state">Loading reviews...</div>
            )}

            {!reviewsLoading && reviewsError && (
              <div className="vendor-review-state error">{reviewsError}</div>
            )}

            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <div className="vendor-review-state">
                No reviews yet. Be the first to review this vendor.
              </div>
            )}

            {!reviewsLoading && !reviewsError && reviews.map((review) => (
              <article className="vendor-review-card" key={review.id}>
                <div className="vendor-review-card-top">
                  <div>
                    <strong>{review.customer_name || "Milan Customer"}</strong>
                    <div className="vendor-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? "filled" : ""}>★</span>
                      ))}
                    </div>
                  </div>
                  <time>
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                      : ""}
                  </time>
                </div>

                {review.review_text && <p>{review.review_text}</p>}
              </article>
            ))}
          </div>
        </section>


        {/* SAVE / FAVOURITE BUTTON */}

        <button
          type="button"
          onClick={toggleSavedVendor}
          disabled={saveLoading}
          aria-pressed={isSaved}
          style={{
            width: "100%",
            marginTop: "22px",
            marginBottom: "12px",
            padding: "13px 18px",
            borderRadius: "14px",
            border: "1px solid #e8b7c8",
            background: isSaved ? "#fff0f5" : "#ffffff",
            color: "#9f3158",
            fontWeight: 800,
            cursor: saveLoading ? "wait" : "pointer",
          }}
        >
          {saveLoading ? "Saving..." : isSaved ? "♥ Saved Vendor" : "♡ Save Vendor"}
        </button>

        {saveError && (
          <div className="enquiry-error" style={{ marginBottom: "12px" }}>
            ⚠ {saveError}
          </div>
        )}


        {/* CONTACT BUTTON */}

        <button
          type="button"
          onClick={() => {

            setShowEnquiryForm(true);

            setEnquiryError("");

            setEnquirySuccess("");

          }}
        >
          Contact Vendor
        </button>


        {/* =================================================
            ENQUIRY FORM
        ================================================= */}

        {showEnquiryForm && (

          <div className="enquiry-section">


            {/* HEADER */}

            <div className="enquiry-header">

              <div>

                <h3>
                  Send Enquiry
                </h3>

                <p>
                  Tell {vendor.business_name} about your wedding.
                </p>

              </div>


              <button
                type="button"
                className="enquiry-close"
                onClick={() => {

                  setShowEnquiryForm(false);

                  setEnquiryError("");

                  setEnquirySuccess("");

                }}
              >
                ✕
              </button>

            </div>


            {/* ERROR MESSAGE */}

            {enquiryError && (

              <div className="enquiry-error">
                ⚠ {enquiryError}
              </div>

            )}


            {/* SUCCESS MESSAGE */}

            {enquirySuccess && (

              <div className="enquiry-success">
                ✓ {enquirySuccess}
              </div>

            )}


            {/* FORM */}

            <form
              className="enquiry-form"
              onSubmit={handleEnquirySubmit}
            >


              {/* NAME */}

              <div className="enquiry-field">

                <label>
                  Your Name
                </label>

                <input
                  type="text"
                  value={
                    enquiryForm.customer_name
                  }
                  onChange={(e) =>
                    setEnquiryForm({
                      ...enquiryForm,

                      customer_name:
                        e.target.value,
                    })
                  }
                  placeholder="Enter your name"
                  required
                />

              </div>


              {/* PHONE */}

              <div className="enquiry-field">

                <label>
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={
                    enquiryForm.phone
                  }
                  onChange={(e) => {

                    // Only allow numbers
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setEnquiryForm({
                      ...enquiryForm,
                      phone: value,
                    });

                  }}
                  placeholder="Enter 10-digit mobile number"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength="10"
                  required
                />

              </div>


              {/* WEDDING DATE */}

              <div className="enquiry-field">

                <label>
                  Wedding Date
                </label>

                <input
                  type="date"
                  value={
                    enquiryForm.wedding_date
                  }

                  min={minWeddingDate}

                  max={maxWeddingDate}

                  onChange={(e) =>
                    setEnquiryForm({
                      ...enquiryForm,

                      wedding_date:
                        e.target.value,
                    })
                  }
                />

              </div>


              {/* MESSAGE */}

              <div className="enquiry-field">

                <label>
                  Message
                </label>

                <textarea
                  value={
                    enquiryForm.message
                  }
                  onChange={(e) =>
                    setEnquiryForm({
                      ...enquiryForm,

                      message:
                        e.target.value,
                    })
                  }
                  placeholder="Tell the vendor about your requirements..."
                  rows="4"
                />

              </div>


              {/* SEND BUTTON */}

              <button
                type="submit"
                className="send-enquiry-button"
                disabled={enquiryLoading}
              >

                {enquiryLoading
                  ? "Sending..."
                  : "Send Enquiry"}

              </button>


            </form>

          </div>

        )}

      </div>

    </div>

  );
}

export default VendorDetails;