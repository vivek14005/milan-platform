{/* Add INSIDE .vendor-enquiry-actions, before Contact Customer */ }
{
  enquiry.status?.toLowerCase() === "accepted" && (
    <button
      type="button"
      className="vendor-conversation-btn"
      onClick={() =>
        navigate(`/booking-conversation/${enquiry.id}`)
      }
    >
      💬 Open Conversation
    </button>
  )
}
