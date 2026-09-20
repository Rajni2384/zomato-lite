"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-9 w-9 transition-colors ${
        filled ? "text-amber-500" : "text-neutral-300"
      }`}
      fill="currentColor"
    >
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch the restaurant name so we know what we're reviewing
  // (this also confirms the restaurant actually exists).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/restaurants/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = (await res.json()) as { name: string };
        if (!cancelled) setRestaurantName(data.name);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Frontend validation is kindness: keep the button dead until the
  // form is ready. The backend still re-checks everything on its own.
  const ready = rating > 0 && comment.trim().length > 0 && !submitting;

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: Number(id),
          rating,
          comment: comment.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.ok) {
        // API accepted it — go see the restaurant page.
        router.push(`/restaurant/${id}`);
        return;
      }
      // Show exactly what the backend said — never invent our own message.
      setError(data.error ?? "Something went wrong.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-16">
        <p className="text-lg font-medium text-neutral-900">Restaurant not found.</p>
      </main>
    );
  }

  if (restaurantName === null) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-16 text-sm text-neutral-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[560px] px-6 py-12">
      {/* 1 — the restaurant name, so we know what we are reviewing */}
      <header className="border-b border-neutral-200 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {restaurantName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Write a review</p>
      </header>

      <form
        className="mt-8 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* 2 — the star picker */}
        <div>
          <p className="text-sm font-medium text-neutral-700">Your rating</p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                onClick={() => setRating(star)}
                className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <Star filled={star <= rating} />
              </button>
            ))}
          </div>
        </div>

        {/* 3 — the comment box */}
        <div>
          <label htmlFor="comment" className="text-sm font-medium text-neutral-700">
            Your review
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think?"
            rows={4}
            className="mt-3 w-full resize-none rounded-xl border border-neutral-300 bg-white p-4 text-neutral-900 placeholder:text-neutral-400 focus:border-amber-600 focus:outline-none"
          />
        </div>

        {/* 4 — the submit button, disabled until the form is ready */}
        <div>
          <button
            type="submit"
            disabled={!ready}
            className={`w-full rounded-lg px-5 py-3 text-sm font-medium transition-colors ${
              ready
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "cursor-not-allowed bg-neutral-200 text-neutral-400"
            }`}
          >
            {submitting ? "Saving…" : "Submit review"}
          </button>
          {/* 5 — if the backend rejects it, show its words, not ours */}
          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}