
"use client";

import { useEffect, useState, type FormEvent } from "react";

type VisitBookingFormProps = {
  propertyId: string;
};

export default function VisitBookingForm({
  propertyId,
}: VisitBookingFormProps) {
  const [visitAt, setVisitAt] = useState("");
  const [message, setMessage] = useState("");
  const [minimumDate, setMinimumDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const localDate = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);

    setMinimumDate(localDate);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    if (!visitAt) {
      setFeedback("Please select a visit date and time.");
      setIsError(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/visit-bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          visitAt: new Date(visitAt).toISOString(),
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit your request.");
      }

      setIsError(false);
      setFeedback("Your visit request has been submitted successfully!");
      setVisitAt("");
      setMessage("");
    } catch (error) {
      setIsError(true);
      setFeedback(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-2xl font-bold text-[#0A1F44]">
        Book a Property Visit
      </h2>

      <p className="mt-2 text-sm text-zinc-600">
        Choose a convenient date and time to visit this property.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="visitAt"
            className="mb-2 block text-sm font-semibold text-zinc-800"
          >
            Preferred Visit Date & Time
          </label>

          <input
            id="visitAt"
            type="datetime-local"
            min={minimumDate}
            value={visitAt}
            onChange={(event) => setVisitAt(event.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-800 outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div>
          <label
            htmlFor="visitMessage"
            className="mb-2 block text-sm font-semibold text-zinc-800"
          >
            Message to Owner (Optional)
          </label>

          <textarea
            id="visitMessage"
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            placeholder="Tell the owner anything they should know..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-800 outline-none focus:border-[#D4AF37]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#0A1F44] px-6 py-3 font-semibold text-white hover:bg-[#163566] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Request Visit"}
        </button>

        {feedback && (
          <p
            role="status"
            className={`text-sm font-medium ${
              isError ? "text-red-600" : "text-green-700"
            }`}
          >
            {feedback}
          </p>
        )}
      </form>
    </section>
  );
}
