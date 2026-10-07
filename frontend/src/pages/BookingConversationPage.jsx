import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./BookingConversationPage.css";

const API_URL = "/api";

const getToken = () =>
  localStorage.getItem("milan_token") ||
  sessionStorage.getItem("milan_token");

const formatPrice = (amount) => {
  if (amount == null) return "Not proposed";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const readResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your login session has expired. Please log in again.");
    }

    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Something went wrong. Please try again."
    );
  }

  return data;
};

export default function BookingConversationPage() {
  const { enquiryId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [priceAmount, setPriceAmount] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [payment, setPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentType, setPaymentType] = useState("booking_amount");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentRejectReason, setPaymentRejectReason] = useState("");
  const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);

  const loadFlow = useCallback(
    async ({ silent = false } = {}) => {
      const token = getToken();

      if (!token) {
        setError("Please log in to open this conversation.");
        setLoading(false);
        return;
      }

      try {
        if (!silent) setLoading(true);

        const response = await fetch(
          `${API_URL}/booking-flow/enquiries/${enquiryId}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await readResponse(response);
        setFlow(data);
        setError("");
      } catch (requestError) {
        if (!silent) {
          setError(
            requestError.message || "Unable to load this conversation."
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [enquiryId]
  );

  useEffect(() => {
    loadFlow();

    const refresh = () => {
      if (document.visibilityState === "visible") {
        loadFlow({ silent: true });
      }
    };

    const timer = window.setInterval(refresh, 7000);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadFlow]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [flow?.messages?.length]);

  const authenticatedRequest = async (path, options = {}) => {
    const token = getToken();

    if (!token) {
      throw new Error("Please log in again to continue.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    return readResponse(response);
  };

  const loadPayment = useCallback(async ({ silent = false } = {}) => {
    const token = getToken();
    if (!token) return;

    try {
      if (!silent) setPaymentLoading(true);
      const response = await fetch(
        `${API_URL}/booking-payments/enquiries/${enquiryId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 409) {
        setPayment(null);
        return;
      }

      setPayment(await readResponse(response));
    } catch (requestError) {
      if (!silent) {
        setError(requestError.message || "Unable to load payment details.");
      }
    } finally {
      if (!silent) setPaymentLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    if (!flow?.negotiation?.price_locked) {
      setPayment(null);
      return undefined;
    }

    loadPayment();
    const timer = window.setInterval(
      () => loadPayment({ silent: true }),
      7000
    );

    return () => window.clearInterval(timer);
  }, [flow?.negotiation?.price_locked, loadPayment]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || sending) return;

    try {
      setSending(true);
      setError("");

      await authenticatedRequest(
        `/booking-flow/enquiries/${enquiryId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ message: cleanMessage }),
        }
      );

      setMessage("");
      await loadFlow({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to send the message.");
    } finally {
      setSending(false);
    }
  };

  const openPriceDialog = () => {
    const suggestedPrice =
      flow?.negotiation?.current_price ?? flow?.enquiry?.package_price ?? "";

    setPriceAmount(suggestedPrice ? String(suggestedPrice) : "");
    setPriceNote("");
    setDialog("price");
  };

  const submitPrice = async (event) => {
    event.preventDefault();

    const numericPrice = Number(priceAmount);

    if (!Number.isInteger(numericPrice) || numericPrice <= 0) {
      setError("Please enter a valid price greater than zero.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await authenticatedRequest(
        `/booking-flow/enquiries/${enquiryId}/price`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: numericPrice,
            note: priceNote.trim() || null,
          }),
        }
      );

      setDialog(null);
      await loadFlow({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to propose this price.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmFinalPrice = async () => {
    try {
      setActionLoading(true);
      setError("");

      await authenticatedRequest(
        `/booking-flow/enquiries/${enquiryId}/price/final`,
        { method: "POST" }
      );

      setDialog(null);
      await loadFlow({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to confirm this price.");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectPrice = async (event) => {
    event.preventDefault();

    try {
      setActionLoading(true);
      setError("");

      await authenticatedRequest(
        `/booking-flow/enquiries/${enquiryId}/price/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason: rejectReason.trim() || null }),
        }
      );

      setDialog(null);
      setRejectReason("");
      await loadFlow({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to reject this price.");
    } finally {
      setActionLoading(false);
    }
  };

  const uploadPaymentProof = async (event) => {
    event.preventDefault();
    const token = getToken();
    const numericAmount = Number(paidAmount);

    if (!token) {
      setError("Please log in again to continue.");
      return;
    }
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid paid amount.");
      return;
    }
    if (payment?.remaining_amount && numericAmount > payment.remaining_amount) {
      setError(`Paid amount cannot exceed ${formatPrice(payment.remaining_amount)}.`);
      return;
    }
    if (!paymentProofFile) {
      setError("Please select the payment screenshot.");
      return;
    }

    const formData = new FormData();
    formData.append("paid_amount", String(numericAmount));
    formData.append("payment_type", paymentType);
    formData.append("transaction_reference", transactionReference.trim());
    formData.append("proof", paymentProofFile);

    try {
      setPaymentActionLoading(true);
      setError("");
      const response = await fetch(
        `${API_URL}/booking-payments/enquiries/${enquiryId}/proof`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      await readResponse(response);
      setPaidAmount("");
      setTransactionReference("");
      setPaymentProofFile(null);
      event.currentTarget.reset();
      await loadPayment({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to upload payment proof.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const markPaymentReceived = async (proof) => {
    try {
      setPaymentActionLoading(true);
      setError("");
      await authenticatedRequest(
        `/booking-payments/proofs/${proof.id}/received`,
        { method: "PUT" }
      );
      await loadPayment({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to confirm this payment.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const rejectPaymentProof = async (event) => {
    event.preventDefault();
    if (!selectedPaymentProof) return;

    try {
      setPaymentActionLoading(true);
      setError("");
      await authenticatedRequest(
        `/booking-payments/proofs/${selectedPaymentProof.id}/reject`,
        {
          method: "PUT",
          body: JSON.stringify({ reason: paymentRejectReason.trim() }),
        }
      );
      setDialog(null);
      setSelectedPaymentProof(null);
      setPaymentRejectReason("");
      await loadPayment({ silent: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to reject this payment proof.");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="milan-conversation-state">
        <div className="milan-conversation-state-card">
          <span>♡</span>
          <h1>Opening conversation...</h1>
          <p>Loading your accepted wedding enquiry.</p>
        </div>
      </main>
    );
  }

  if (!flow) {
    return (
      <main className="milan-conversation-state">
        <div className="milan-conversation-state-card">
          <span>!</span>
          <h1>Conversation unavailable</h1>
          <p>{error || "Unable to open this conversation."}</p>
          <button type="button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const role = flow.participant_role;
  const isCustomer = role === "customer";
  const partnerName = isCustomer
    ? flow.vendor?.business_name || "Milan Vendor"
    : flow.customer?.full_name || flow.enquiry?.customer_name || "Customer";
  const partnerPhone = isCustomer
    ? flow.vendor?.phone
    : flow.customer?.phone || flow.enquiry?.phone;
  const partnerInitial = partnerName.trim().charAt(0).toUpperCase() || "M";
  const negotiation = flow.negotiation;
  const currentPrice = negotiation?.current_price;
  const priceLocked = Boolean(negotiation?.price_locked);
  const actualPriceToPay = priceLocked
    ? negotiation?.final_price
    : null;
  const userConfirmed = isCustomer
    ? negotiation?.customer_confirmed
    : negotiation?.vendor_confirmed;
  const otherConfirmed = isCustomer
    ? negotiation?.vendor_confirmed
    : negotiation?.customer_confirmed;
  const backPath = isCustomer ? "/customer-requests" : "/vendor-dashboard";

  return (
    <main className="milan-conversation-page">
      <header className="milan-conversation-topbar">
        <button type="button" onClick={() => navigate(backPath)}>
          ← Back
        </button>
        <span className="milan-conversation-logo">
          Milan<span>•</span>
        </span>
        <div className="milan-conversation-enquiry-id">
          Enquiry #{flow.enquiry.id}
        </div>
      </header>

      <div className="milan-conversation-shell">
        {error && (
          <div className="milan-conversation-error" role="alert">
            {error}
            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        <div className="milan-conversation-layout">
          <aside className="milan-conversation-sidebar">
            <div className="milan-conversation-partner">
              <div className="milan-conversation-avatar">{partnerInitial}</div>
              <div>
                <p>{isCustomer ? "WEDDING VENDOR" : "CUSTOMER"}</p>
                <h1>{partnerName}</h1>
                {isCustomer && flow.vendor?.is_verified && (
                  <span>✓ Verified by Milan</span>
                )}
              </div>
            </div>

            <div className="milan-conversation-contact-row">
              <a href={partnerPhone ? `tel:${partnerPhone}` : undefined}>
                ☎ Call
              </a>
              <a
                href={
                  partnerPhone
                    ? `https://wa.me/91${String(partnerPhone).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hello, this is regarding Milan enquiry #${flow.enquiry.id}.`)}`
                    : undefined
                }
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>

            <section className="milan-conversation-details">
              <p className="milan-conversation-label">ENQUIRY DETAILS</p>
              <dl>
                <div>
                  <dt>Package</dt>
                  <dd>{flow.enquiry.package_name || "Custom enquiry"}</dd>
                </div>
                <div>
                  <dt>Package price</dt>
                  <dd>{formatPrice(flow.enquiry.package_price)}</dd>
                </div>
                <div>
                  <dt>Wedding date</dt>
                  <dd>{flow.enquiry.wedding_date || "Not provided"}</dd>
                </div>
              </dl>
            </section>

            <section
              className={`milan-conversation-price ${priceLocked ? "is-locked" : ""
                }`}
            >
              <p className="milan-conversation-label">
                {priceLocked ? "FINAL BOOKING PRICE" : "PRICE NEGOTIATION"}
              </p>

              <div className="milan-conversation-current-price">
                {formatPrice(
                  priceLocked ? negotiation.final_price : currentPrice
                )}
              </div>

              {priceLocked ? (
                <div className="milan-conversation-locked">
                  <span>✓</span>
                  <div>
                    <strong>Confirmed and locked</strong>
                    <p>This price can no longer be edited or rejected.</p>
                  </div>
                </div>
              ) : (
                <>
                  {negotiation?.status === "price_rejected" && (
                    <div className="milan-conversation-rejected-note">
                      Price rejected
                      {negotiation.rejection_reason
                        ? ` — ${negotiation.rejection_reason}`
                        : ". A new price can be proposed."}
                    </div>
                  )}

                  {currentPrice != null && (
                    <p className="milan-conversation-proposed-by">
                      Proposed by {negotiation.last_proposed_by_role}
                    </p>
                  )}

                  {userConfirmed && !otherConfirmed && (
                    <div className="milan-conversation-waiting">
                      ✓ You confirmed this price. Waiting for the {isCustomer
                        ? "vendor"
                        : "customer"}.
                    </div>
                  )}

                  <div className="milan-conversation-price-actions">
                    <button
                      type="button"
                      className="milan-price-edit"
                      onClick={openPriceDialog}
                    >
                      {currentPrice == null ? "Propose Price" : "Edit This Price"}
                    </button>

                    {currentPrice != null && (
                      <>
                        <button
                          type="button"
                          className="milan-price-final"
                          disabled={Boolean(userConfirmed)}
                          onClick={() => setDialog("final")}
                        >
                          {userConfirmed ? "Confirmed" : "Final"}
                        </button>
                        <button
                          type="button"
                          className="milan-price-reject"
                          onClick={() => setDialog("reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>

            <section
              className={`milan-payment-summary ${priceLocked ? "is-final" : ""
                }`}
            >
              <p className="milan-conversation-label">PAYMENT SUMMARY</p>

              <div className="milan-payment-summary-row">
                <span>Package Price</span>
                <strong>{formatPrice(flow.enquiry.package_price)}</strong>
              </div>

              <div className="milan-payment-summary-row">
                <span>Final Agreed Price</span>
                <strong>
                  {priceLocked
                    ? formatPrice(negotiation.final_price)
                    : "Not finalised"}
                </strong>
              </div>

              <div className="milan-payment-summary-total">
                <span>
                  {isCustomer
                    ? "Actual Price to Pay"
                    : "Actual Price to Receive"}
                </span>
                <strong>
                  {priceLocked
                    ? formatPrice(actualPriceToPay)
                    : "Waiting for confirmation"}
                </strong>
              </div>

              {priceLocked ? (
                <>
                  <div className="milan-payment-summary-row payment-received-row">
                    <span>{isCustomer ? "Vendor Received" : "Amount Received"}</span>
                    <strong>{formatPrice(payment?.amount_received || 0)}</strong>
                  </div>
                  <div className="milan-payment-summary-row">
                    <span>Pending Verification</span>
                    <strong>{formatPrice(payment?.pending_verification_amount || 0)}</strong>
                  </div>
                  <div className="milan-payment-summary-balance">
                    <span>{isCustomer ? "Remaining to Pay" : "Remaining to Receive"}</span>
                    <strong>{formatPrice(payment?.remaining_amount ?? actualPriceToPay)}</strong>
                  </div>
                  <small>
                    {payment?.payment_complete
                      ? "✓ Full payment received — booking payment complete"
                      : "✓ Final price confirmed by customer and vendor"}
                  </small>
                </>
              ) : (
                <small>
                  This amount will appear after both sides confirm the final price.
                </small>
              )}
            </section>

            {priceLocked && (
              <section className="milan-payment-workspace">
                <div className="milan-payment-workspace-head">
                  <p className="milan-conversation-label">PAYMENT & PROOFS</p>
                  <span className={payment?.payment_complete ? "complete" : "active"}>
                    {payment?.payment_complete ? "Payment complete" : "In progress"}
                  </span>
                </div>

                {paymentLoading ? (
                  <p className="milan-payment-loading">Loading payment details...</p>
                ) : isCustomer && !payment?.payment_complete &&
                  !payment?.proofs?.some((item) => item.status === "pending") ? (
                  <form className="milan-payment-upload-form" onSubmit={uploadPaymentProof}>
                    <label>
                      Payment type
                      <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)}>
                        <option value="booking_amount">Booking / advance amount</option>
                        <option value="remaining_payment">Remaining payment</option>
                        <option value="full_payment">Full payment</option>
                      </select>
                    </label>
                    <label>
                      Amount paid
                      <input
                        type="number"
                        min="1"
                        max={payment?.remaining_amount || actualPriceToPay}
                        required
                        value={paidAmount}
                        onChange={(event) => setPaidAmount(event.target.value)}
                        placeholder="Enter amount"
                      />
                    </label>
                    <label>
                      UTR / transaction reference (optional)
                      <input
                        type="text"
                        maxLength={120}
                        value={transactionReference}
                        onChange={(event) => setTransactionReference(event.target.value)}
                        placeholder="Enter UTR or reference"
                      />
                    </label>
                    <label className="milan-payment-file-field">
                      Payment screenshot (JPG, PNG or WEBP)
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        onChange={(event) => setPaymentProofFile(event.target.files?.[0] || null)}
                      />
                    </label>
                    <button type="submit" disabled={paymentActionLoading}>
                      {paymentActionLoading ? "Uploading..." : "Submit Payment Proof"}
                    </button>
                  </form>
                ) : isCustomer && payment?.proofs?.some((item) => item.status === "pending") ? (
                  <div className="milan-payment-awaiting-review">
                    <span>⌛</span>
                    <div>
                      <strong>Proof waiting for vendor review</strong>
                      <p>You can upload another payment after this proof is reviewed.</p>
                    </div>
                  </div>
                ) : null}

                {Array.isArray(payment?.proofs) && payment.proofs.length > 0 && (
                  <div className="milan-payment-proof-list">
                    {payment.proofs.map((proof) => (
                      <article className="milan-payment-proof-card" key={proof.id}>
                        <a href={`${API_URL}${proof.proof_url}`} target="_blank" rel="noreferrer" className="milan-payment-proof-image">
                          <img src={`${API_URL}${proof.proof_url}`} alt={`Payment proof ${proof.id}`} />
                        </a>
                        <div className="milan-payment-proof-content">
                          <div>
                            <strong>{formatPrice(proof.paid_amount)}</strong>
                            <span className={`proof-status status-${proof.status}`}>{proof.status}</span>
                          </div>
                          <p>{proof.payment_type.replaceAll("_", " ")}</p>
                          {proof.transaction_reference && <small>Reference: {proof.transaction_reference}</small>}
                          {proof.rejection_reason && <small className="proof-rejection">Reason: {proof.rejection_reason}</small>}
                          <time>{formatDateTime(proof.created_at)}</time>

                          {!isCustomer && proof.status === "pending" && (
                            <div className="milan-payment-review-actions">
                              <button type="button" className="receive" disabled={paymentActionLoading} onClick={() => markPaymentReceived(proof)}>
                                Mark Received
                              </button>
                              <button
                                type="button"
                                className="reject"
                                disabled={paymentActionLoading}
                                onClick={() => {
                                  setSelectedPaymentProof(proof);
                                  setPaymentRejectReason("");
                                  setDialog("payment-reject");
                                }}
                              >
                                Reject Proof
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {priceLocked && (
              <button
                type="button"
                className="milan-view-receipt-button"
                onClick={() => navigate(`/booking-receipt/${enquiryId}`)}
              >
                View Booking Receipt
              </button>
            )}

            {Array.isArray(flow.price_history) &&
              flow.price_history.length > 0 && (
                <details className="milan-conversation-history">
                  <summary>View price history</summary>
                  <div>
                    {flow.price_history.map((item) => (
                      <p key={item.id}>
                        <strong>{item.actor_role}</strong> {item.action_type
                          .replaceAll("_", " ")}
                        {item.amount != null
                          ? ` ${formatPrice(item.amount)}`
                          : ""}
                      </p>
                    ))}
                  </div>
                </details>
              )}
          </aside>

          <section className="milan-conversation-chat">
            <header className="milan-conversation-chat-head">
              <div>
                <p className="milan-conversation-label">PRIVATE CONVERSATION</p>
                <h2>{partnerName}</h2>
              </div>
              <span>Enquiry accepted</span>
            </header>

            <div className="milan-conversation-messages" aria-live="polite">
              <div className="milan-conversation-system-message">
                ✓ The vendor accepted this enquiry. Conversation is now open.
              </div>

              {(flow.messages || []).length === 0 ? (
                <div className="milan-conversation-empty-chat">
                  <span>♡</span>
                  <h3>Start the conversation</h3>
                  <p>
                    Discuss event requirements, services and the final booking
                    price here.
                  </p>
                </div>
              ) : (
                (flow.messages || []).map((item) => {
                  const isMine = item.sender_role === role;

                  return (
                    <div
                      className={`milan-conversation-message ${isMine ? "is-mine" : ""
                        }`}
                      key={item.id}
                    >
                      <div className="milan-conversation-message-avatar">
                        {isMine
                          ? role.charAt(0).toUpperCase()
                          : partnerInitial}
                      </div>
                      <div className="milan-conversation-bubble">
                        <p>{item.message}</p>
                        <time>{formatDateTime(item.created_at)}</time>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="milan-conversation-composer" onSubmit={sendMessage}>
              <input
                type="text"
                value={message}
                maxLength={2000}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={`Message ${partnerName}...`}
                aria-label={`Message ${partnerName}`}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </section>
        </div>
      </div>

      {dialog && (
        <div
          className="milan-conversation-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setDialog(null);
            }
          }}
        >
          <section
            className="milan-conversation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="conversation-dialog-title"
          >
            {dialog === "price" && (
              <form onSubmit={submitPrice}>
                <p className="milan-conversation-label">PRICE PROPOSAL</p>
                <h2 id="conversation-dialog-title">
                  {currentPrice == null
                    ? "Propose a booking price"
                    : "Edit the proposed price"}
                </h2>
                <p>
                  Sending a new price will reset any previous confirmations.
                </p>
                <label>
                  Amount in rupees
                  <input
                    type="number"
                    min="1"
                    max="100000000"
                    required
                    value={priceAmount}
                    onChange={(event) => setPriceAmount(event.target.value)}
                  />
                </label>
                <label>
                  Note (optional)
                  <textarea
                    rows="3"
                    maxLength={500}
                    value={priceNote}
                    onChange={(event) => setPriceNote(event.target.value)}
                    placeholder="Explain what is included in this price..."
                  />
                </label>
                <div className="milan-conversation-modal-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={actionLoading}
                    onClick={() => setDialog(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={actionLoading}>
                    {actionLoading ? "Sending..." : "Send Price"}
                  </button>
                </div>
              </form>
            )}

            {dialog === "final" && (
              <div>
                <p className="milan-conversation-label">CONFIRM FINAL PRICE</p>
                <h2 id="conversation-dialog-title">Are you sure?</h2>
                <p>
                  You are confirming <strong>{formatPrice(currentPrice)}</strong>.
                  When both customer and vendor confirm, this price will be
                  permanently locked.
                </p>
                <div className="milan-conversation-modal-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={actionLoading}
                    onClick={() => setDialog(null)}
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={confirmFinalPrice}
                  >
                    {actionLoading ? "Confirming..." : "Yes, Finalise Price"}
                  </button>
                </div>
              </div>
            )}

            {dialog === "reject" && (
              <form onSubmit={rejectPrice}>
                <p className="milan-conversation-label">REJECT PROPOSED PRICE</p>
                <h2 id="conversation-dialog-title">Reject this price?</h2>
                <p>
                  You are rejecting <strong>{formatPrice(currentPrice)}</strong>.
                  A new price can still be proposed afterwards.
                </p>
                <label>
                  Reason (optional)
                  <textarea
                    rows="3"
                    maxLength={300}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Price is too high, services need changes..."
                  />
                </label>
                <div className="milan-conversation-modal-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={actionLoading}
                    onClick={() => setDialog(null)}
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="danger"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Rejecting..." : "Yes, Reject Price"}
                  </button>
                </div>
              </form>
            )}

            {dialog === "payment-reject" && (
              <form onSubmit={rejectPaymentProof}>
                <p className="milan-conversation-label">REJECT PAYMENT PROOF</p>
                <h2 id="conversation-dialog-title">Reject this payment proof?</h2>
                <p>
                  The customer will be notified and can upload a corrected proof.
                </p>
                <label>
                  Reason
                  <textarea
                    rows="3"
                    maxLength={300}
                    required
                    value={paymentRejectReason}
                    onChange={(event) => setPaymentRejectReason(event.target.value)}
                    placeholder="Screenshot unclear, amount not received..."
                  />
                </label>
                <div className="milan-conversation-modal-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={paymentActionLoading}
                    onClick={() => {
                      setDialog(null);
                      setSelectedPaymentProof(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="danger"
                    disabled={paymentActionLoading || !paymentRejectReason.trim()}
                  >
                    {paymentActionLoading ? "Rejecting..." : "Yes, Reject Proof"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
