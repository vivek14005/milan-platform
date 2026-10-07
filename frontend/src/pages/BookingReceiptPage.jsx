import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./BookingReceiptPage.css";

const getToken = () =>
  localStorage.getItem("milan_token") ||
  sessionStorage.getItem("milan_token");

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateOnly = (value) => {
  if (!value) return "Not provided";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const dateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function BookingReceiptPage() {
  const { enquiryId } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReceipt = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("Please log in to view this booking receipt.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/booking-receipts/enquiries/${enquiryId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Unable to load booking receipt.");
      }
      setReceipt(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load booking receipt.");
    } finally {
      setLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  if (loading) {
    return <main className="milan-receipt-state">Preparing your receipt...</main>;
  }

  if (!receipt) {
    return (
      <main className="milan-receipt-state">
        <h1>Receipt unavailable</h1>
        <p>{error}</p>
        <button type="button" onClick={() => navigate(-1)}>Go Back</button>
      </main>
    );
  }

  const isCustomer = receipt.participant_role === "customer";
  const backPath = isCustomer ? "/customer-requests" : "/vendor-dashboard";
  const address = [
    receipt.vendor.address,
    receipt.vendor.area,
    receipt.vendor.district,
    receipt.vendor.state,
    receipt.vendor.pincode,
  ].filter(Boolean).join(", ");

  return (
    <main className="milan-receipt-page">
      <header className="milan-receipt-toolbar">
        <button type="button" onClick={() => navigate(backPath)}>← Back</button>
        <span>Milan<i>•</i></span>
        <button type="button" className="print-button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </header>

      <article className="milan-receipt-paper">
        <header className="milan-receipt-head">
          <div>
            <p>WEDDING BOOKING RECEIPT</p>
            <h1>Milan<span>•</span></h1>
            <small>Where beautiful celebrations begin.</small>
          </div>
          <div className="milan-receipt-number">
            <span>RECEIPT NUMBER</span>
            <strong>{receipt.receipt_number}</strong>
            <small>Generated {dateTime(receipt.generated_at)}</small>
          </div>
        </header>

        <section className="milan-receipt-status-row">
          <div>
            <span>BOOKING STATUS</span>
            <strong>{receipt.booking_status}</strong>
          </div>
          <div className={`payment-${receipt.payment_status}`}>
            <span>PAYMENT STATUS</span>
            <strong>{receipt.payment_status_label}</strong>
          </div>
          <div>
            <span>WEDDING DATE</span>
            <strong>{dateOnly(receipt.enquiry.wedding_date)}</strong>
          </div>
        </section>

        <section className="milan-receipt-parties">
          <div>
            <p>CUSTOMER</p>
            <h2>{receipt.customer.full_name}</h2>
            <span>{receipt.customer.phone || "Phone not provided"}</span>
            <span>{receipt.customer.email || "Email not provided"}</span>
          </div>
          <div>
            <p>WEDDING PROFESSIONAL</p>
            <h2>{receipt.vendor.business_name}</h2>
            <span>{receipt.vendor.category}</span>
            <span>{receipt.vendor.phone}</span>
            <span>{receipt.vendor.email || "Email not provided"}</span>
            {address && <span>{address}</span>}
          </div>
        </section>

        <section className="milan-receipt-package">
          <div>
            <p>SELECTED SERVICE</p>

            <h2>
              {receipt.enquiry.package_name || "Custom Wedding Service"}
            </h2>
          </div>

          <strong>
            {receipt.price.package_price != null
              ? money(receipt.price.package_price)
              : "Not Selected"}
          </strong>
        </section>

        <section className="milan-receipt-price-grid">
          <div>
            <span>Package Price</span>

            <strong>
              {receipt.price.package_price != null
                ? money(receipt.price.package_price)
                : "Not Selected"}
            </strong>
          </div>

          <div>
            <span>Final Agreed Price</span>
            <strong>{money(receipt.price.final_price)}</strong>
          </div>

          <div>
            <span>Amount Received</span>
            <strong>{money(receipt.price.amount_received)}</strong>
          </div>

          <div className="remaining">
            <span>Remaining Amount</span>
            <strong>{money(receipt.price.remaining_amount)}</strong>
          </div>
        </section>
        <section className="milan-receipt-payments">
          <div className="section-title">
            <p>VERIFIED PAYMENT HISTORY</p>
            <span>{receipt.payments.length} verified payment(s)</span>
          </div>

          {receipt.payments.length === 0 ? (
            <p className="no-payments">No payment has been confirmed by the vendor yet.</p>
          ) : (
            <div className="payment-table-wrap">
              <table>
                <thead>
                  <tr><th>Payment</th><th>Reference</th><th>Verified</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {receipt.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.payment_label}</td>
                      <td>{payment.transaction_reference || "—"}</td>
                      <td>{dateTime(payment.verified_at)}</td>
                      <td>{money(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="milan-receipt-footer">
          <p>{receipt.notice}</p>
          <div><span>Generated securely by</span><strong>Milan Wedding Marketplace</strong></div>
        </footer>
      </article>
    </main>
  );
}
