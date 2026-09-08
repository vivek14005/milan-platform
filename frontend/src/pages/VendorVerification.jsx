import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VendorVerification.css";

const API_URL = "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_META = {
  identity_proof: {
    title: "Masked Aadhaar / Identity Proof",
    description:
      "Upload a masked Aadhaar or another accepted identity proof. Do not enter your Aadhaar number.",
    accept: ".jpg,.jpeg,.png,.pdf",
    required: true,
    icon: "🪪",
  },
  self_photo: {
    title: "Vendor Self Photo",
    description:
      "Upload a clear recent photo of yourself. JPG, JPEG or PNG only.",
    accept: "image/jpeg,image/png",
    required: true,
    icon: "📷",
  },
  gst_certificate: {
    title: "GST Certificate",
    description:
      "Required when your business has GST registration.",
    accept: ".jpg,.jpeg,.png,.pdf",
    required: true,
    icon: "📄",
  },
  electricity_bill: {
    title: "Latest Electricity Bill",
    description:
      "Required when your business does not have GST registration.",
    accept: ".jpg,.jpeg,.png,.pdf",
    required: true,
    icon: "⚡",
  },
};

function getToken() {
  return (
    localStorage.getItem("milan_token") ||
    sessionStorage.getItem("milan_token")
  );
}

function normalizeDocument(document) {
  return {
    id: document?.id,
    document_type: document?.document_type || "",
    file_url: document?.file_url || "",
    original_filename:
      document?.original_filename ||
      document?.filename ||
      "Uploaded document",
    uploaded_at: document?.uploaded_at || null,
  };
}

function VendorVerification() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingType, setUploadingType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [hasGst, setHasGst] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [status, setStatus] = useState("not_submitted");
  const [adminNote, setAdminNote] = useState("");
  const [documents, setDocuments] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = getToken();

  const documentMap = useMemo(() => {
    const map = {};
    documents.forEach((document) => {
      if (document?.document_type) {
        map[document.document_type] = document;
      }
    });
    return map;
  }, [documents]);

  const requiredTypes = useMemo(
    () =>
      hasGst
        ? ["identity_proof", "self_photo", "gst_certificate"]
        : ["identity_proof", "self_photo", "electricity_bill"],
    [hasGst]
  );

  const missingDocuments = requiredTypes.filter(
    (type) => !documentMap[type]
  );

  const isApproved = status === "approved";
  const isPending = status === "pending";
  const canEdit = !isApproved && !isPending;

  const loadVerification = async () => {
    if (!token) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/vendor-verification/me`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load verification details."
        );
      }

      const verification =
        data.verification || data || {};

      setHasGst(Boolean(verification.has_gst));
      setGstNumber(verification.gst_number || "");
      setStatus(
        verification.status ||
        data.status ||
        "not_submitted"
      );
      setAdminNote(
        verification.admin_note ||
        data.admin_note ||
        ""
      );

      const receivedDocuments =
        verification.documents ||
        data.documents ||
        [];

      setDocuments(
        Array.isArray(receivedDocuments)
          ? receivedDocuments.map(normalizeDocument)
          : []
      );
    } catch (err) {
      setError(
        err.message ||
        "Unable to load verification details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBusinessType = async (nextHasGst = hasGst) => {
    if (!token || !canEdit) return false;

    const cleanGst = gstNumber.trim().toUpperCase();

    if (nextHasGst && !cleanGst) {
      setError("Please enter your GST number.");
      return false;
    }

    try {
      setSavingProfile(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/vendor-verification/setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            has_gst: nextHasGst,
            gst_number: nextHasGst ? cleanGst : null,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to save GST details."
        );
      }

      const verification =
        data.verification || data || {};

      setHasGst(Boolean(verification.has_gst));
      setGstNumber(verification.gst_number || "");
      setStatus(
        verification.status || status
      );

      if (Array.isArray(verification.documents)) {
        setDocuments(
          verification.documents.map(normalizeDocument)
        );
      }

      setMessage("Business verification details saved.");
      return true;
    } catch (err) {
      setError(
        err.message || "Unable to save GST details."
      );
      return false;
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGstChoice = async (value) => {
    if (!canEdit) return;

    setHasGst(value);
    setError("");
    setMessage("");

    if (!value) {
      setGstNumber("");
    }
  };

  const validateFile = (file, type) => {
    if (!file) {
      return "Please select a file.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size must be 5 MB or less.";
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "";

    if (type === "self_photo") {
      if (
        !["jpg", "jpeg", "png"].includes(extension) ||
        !file.type.startsWith("image/")
      ) {
        return "Self photo must be JPG, JPEG or PNG.";
      }
      return "";
    }

    if (!["jpg", "jpeg", "png", "pdf"].includes(extension)) {
      return "Please upload JPG, JPEG, PNG or PDF.";
    }

    return "";
  };

  const uploadDocument = async (type, file) => {
    if (!token || !canEdit) return;

    const validationError = validateFile(file, type);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (hasGst && !gstNumber.trim()) {
      setError(
        "Please enter and save your GST number before uploading the GST certificate."
      );
      return;
    }

    try {
      setUploadingType(type);
      setError("");
      setMessage("");

      const profileSaved = await saveBusinessType(hasGst);
      if (!profileSaved) return;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/vendor-verification/document/${type}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to upload document."
        );
      }

      const uploaded =
        data.document ||
        data.verification_document ||
        null;

      if (uploaded) {
        const normalized = normalizeDocument(uploaded);
        setDocuments((current) => [
          ...current.filter(
            (item) => item.document_type !== type
          ),
          normalized,
        ]);
      } else {
        await loadVerification();
      }

      setMessage(
        `${DOCUMENT_META[type].title} uploaded successfully.`
      );
    } catch (err) {
      setError(
        err.message || "Unable to upload document."
      );
    } finally {
      setUploadingType("");
    }
  };

  const submitVerification = async () => {
    if (!token || !canEdit) return;

    setError("");
    setMessage("");

    if (hasGst && !gstNumber.trim()) {
      setError("Please enter your GST number.");
      return;
    }

    if (missingDocuments.length > 0) {
      const names = missingDocuments
        .map((type) => DOCUMENT_META[type]?.title || type)
        .join(", ");

      setError(`Please upload: ${names}.`);
      return;
    }

    try {
      setSubmitting(true);

      const saved = await saveBusinessType(hasGst);
      if (!saved) return;

      const response = await fetch(
        `${API_URL}/vendor-verification/submit`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to submit verification request."
        );
      }

      setStatus(
        data.verification?.status ||
        data.status ||
        "pending"
      );
      setMessage(
        "Verification submitted successfully. Milan will review your documents."
      );
      await loadVerification();
    } catch (err) {
      setError(
        err.message ||
        "Unable to submit verification request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderDocumentCard = (type) => {
    const meta = DOCUMENT_META[type];
    const uploaded = documentMap[type];
    const uploading = uploadingType === type;

    return (
      <article
        className={`verification-document-card ${uploaded ? "uploaded" : ""
          }`}
        key={type}
      >
        <div className="verification-document-icon">
          {meta.icon}
        </div>

        <div className="verification-document-copy">
          <div className="verification-document-title-row">
            <h3>{meta.title}</h3>
            <span className="verification-required">
              Required
            </span>
          </div>

          <p>{meta.description}</p>

          {uploaded && (
            <div className="verification-uploaded-file">
              <span>✓</span>
              <div>
                <strong>
                  {uploaded.original_filename}
                </strong>
                <small>
                  Uploaded successfully
                </small>
              </div>
            </div>
          )}

          {canEdit && (
            <label
              className={`verification-upload-btn ${uploading ? "disabled" : ""
                }`}
            >
              {uploading
                ? "Uploading..."
                : uploaded
                  ? "Replace Document"
                  : "Choose Document"}

              <input
                type="file"
                accept={meta.accept}
                disabled={uploading}
                onChange={(event) => {
                  const file =
                    event.target.files?.[0];
                  event.target.value = "";
                  if (file) {
                    uploadDocument(type, file);
                  }
                }}
              />
            </label>
          )}
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="vendor-verification-message">
        Loading verification details...
      </div>
    );
  }

  return (
    <div className="vendor-verification-page">
      <main className="vendor-verification-shell">
        <header className="vendor-verification-header">
          <div>
            <span className="verification-eyebrow">
              MILAN TRUST & SAFETY
            </span>
            <h1>Milan Vendor Verification</h1>
            <p>
              Build trust with couples by completing your official Milan vendor verification.
            </p>
          </div>

          <button
            type="button"
            className="verification-back-btn"
            onClick={() =>
              navigate("/vendor-dashboard")
            }
          >
            ← Vendor Dashboard
          </button>
        </header>

        <section
          className={`verification-status-card status-${status}`}
        >
          <div className="verification-status-icon">
            {status === "approved"
              ? "✓"
              : status === "pending"
                ? "⌛"
                : status === "rejected"
                  ? "!"
                  : "🛡"}
          </div>

          <div>
            <span>VERIFICATION STATUS</span>
            <h2>
              {status === "approved"
                ? "Verified by Milan"
                : status === "pending"
                  ? "Verification Under Review"
                  : status === "rejected"
                    ? "Verification Needs Changes"
                    : "Verification Not Submitted"}
            </h2>

            <p>
              {status === "approved"
                ? "Your business has been approved. Customers can now see your verified status."
                : status === "pending"
                  ? "Your documents have been submitted. You cannot edit them while Milan reviews your request."
                  : status === "rejected"
                    ? "Review the admin note, correct your documents and submit again."
                    : "Upload the required documents and submit them for review."}
            </p>
          </div>
        </section>

        {status === "rejected" && adminNote && (
          <section className="verification-admin-note">
            <strong>Admin note</strong>
            <p>{adminNote}</p>
          </section>
        )}

        {error && (
          <div className="verification-alert error">
            ⚠ {error}
          </div>
        )}

        {message && (
          <div className="verification-alert success">
            ✓ {message}
          </div>
        )}

        <section className="verification-section">
          <div className="verification-section-heading">
            <div>
              <span>STEP 1</span>
              <h2>Business Registration</h2>
            </div>
            <p>
              Tell us whether your business has GST
              registration.
            </p>
          </div>

          <div className="verification-gst-choice">
            <button
              type="button"
              disabled={!canEdit}
              className={hasGst ? "active" : ""}
              onClick={() => handleGstChoice(true)}
            >
              <strong>Yes, I have GST</strong>
              <span>
                GST certificate will be required
              </span>
            </button>

            <button
              type="button"
              disabled={!canEdit}
              className={!hasGst ? "active" : ""}
              onClick={() => handleGstChoice(false)}
            >
              <strong>No GST registration</strong>
              <span>
                Latest electricity bill will be required
              </span>
            </button>
          </div>

          {hasGst && (
            <div className="verification-gst-field">
              <label htmlFor="gst-number">
                GST Number
              </label>
              <input
                id="gst-number"
                type="text"
                value={gstNumber}
                disabled={!canEdit}
                maxLength={20}
                placeholder="Enter GST number"
                onChange={(event) =>
                  setGstNumber(
                    event.target.value.toUpperCase()
                  )
                }
              />
              <small>
                GST number is stored for business
                verification. Aadhaar number is not stored.
              </small>
            </div>
          )}

          {canEdit && (
            <button
              type="button"
              className="verification-save-btn"
              disabled={savingProfile}
              onClick={() =>
                saveBusinessType(hasGst)
              }
            >
              {savingProfile
                ? "Saving..."
                : "Save Business Details"}
            </button>
          )}
        </section>

        <section className="verification-section">
          <div className="verification-section-heading">
            <div>
              <span>STEP 2</span>
              <h2>Required Documents</h2>
            </div>
            <p>
              Maximum file size 5 MB. Identity documents
              can be JPG, PNG or PDF.
            </p>
          </div>

          <div className="verification-privacy-note">
            <span>🔒</span>
            <p>
              <strong>Your privacy matters.</strong>{" "}
              Upload a masked Aadhaar/identity proof only.
              Milan does not ask you to type or store your
              full Aadhaar number here.
            </p>
          </div>

          <div className="verification-documents-grid">
            {renderDocumentCard("identity_proof")}
            {renderDocumentCard("self_photo")}
            {hasGst
              ? renderDocumentCard("gst_certificate")
              : renderDocumentCard("electricity_bill")}
          </div>
        </section>

        <section className="verification-submit-card">
          <div>
            <span>STEP 3</span>
            <h2>Submit for Review</h2>
            <p>
              Uploading files does not make your profile
              verified. Milan approval is required before
              the verified badge appears.
            </p>

            {canEdit && missingDocuments.length > 0 && (
              <small>
                {missingDocuments.length} required
                document
                {missingDocuments.length > 1 ? "s" : ""}{" "}
                remaining.
              </small>
            )}
          </div>

          {isApproved ? (
            <div className="verification-final-badge">
              ✓ Verified by Milan
            </div>
          ) : isPending ? (
            <button
              type="button"
              className="verification-submit-btn"
              disabled
            >
              Review Pending
            </button>
          ) : (
            <button
              type="button"
              className="verification-submit-btn"
              disabled={
                submitting ||
                savingProfile ||
                Boolean(uploadingType) ||
                missingDocuments.length > 0
              }
              onClick={submitVerification}
            >
              {submitting
                ? "Submitting..."
                : status === "rejected"
                  ? "Resubmit Verification"
                  : "Submit Verification"}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

export default VendorVerification;
