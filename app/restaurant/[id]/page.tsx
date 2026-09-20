"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type Restaurant = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [notFound, setNotFound] = useState(false);

  // This whole page is: ask the API, render what it says.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/restaurants/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = (await res.json()) as Restaurant;
        if (!cancelled) setRestaurant(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-16">
        <p className="text-lg font-medium text-neutral-900">Restaurant not found.</p>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-16 text-sm text-neutral-500">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[560px] px-6 py-12">
      {/* 1 — the restaurant name, with cuisine and area underneath */}
      <header className="border-b border-neutral-200 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {restaurant.name}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {restaurant.cuisine} · {restaurant.area}
        </p>
      </header>

      {restaurant.totalReviews === 0 ? (
        /* 6 — nothing yet: invite the first review */
        <section className="mt-12 rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <p className="text-lg font-medium text-neutral-900">No reviews yet.</p>
          <p className="mt-2 text-sm text-neutral-500">
            Be the first to say what you think.
          </p>
          <Link
            href={`/review/${id}`}
            className="mt-6 inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Write the first review
          </Link>
        </section>
      ) : (
        <>
          {/* 2 — the average rating, big. This line just prints what the backend
              computed for us. There is no maths anywhere in this file. */}
          <section className="border-b border-neutral-200 py-8">
            <div className="flex items-end gap-3">
              <p className="text-6xl font-semibold leading-none tracking-tight text-neutral-900">
                {restaurant.averageRating}
              </p>
              <p className="pb-1 text-sm text-neutral-500">
                {restaurant.totalReviews}{" "}
                {restaurant.totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
              Average rating
            </p>
          </section>

          {/* 3 — the latest review, highlighted so it sits apart */}
          {restaurant.latestReview && (
            <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50/60 p-6">
              <p className="text-xs font-medium uppercase tracking-widest text-amber-700">
                Latest review
              </p>
              <p className="mt-3 text-neutral-900">{restaurant.latestReview.comment}</p>
              <p className="mt-2 text-sm text-neutral-500">
                {restaurant.latestReview.rating} / 5 ·{" "}
                {formatDate(restaurant.latestReview.createdAt)}
              </p>
            </section>
          )}

          {/* 4 — the older reviews, in a plain list */}
          <section className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-400">
              All reviews
            </h2>
            <ul className="mt-2 divide-y divide-neutral-200">
              {restaurant.reviews.map((review) => (
                <li key={review.id} className="py-5">
                  <p className="text-neutral-900">{review.comment}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {review.rating} / 5 · {formatDate(review.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* 5 — the way in to write a new review */}
          <section className="mt-10">
            <Link
              href={`/review/${id}`}
              className="inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              Write a review
            </Link>
          </section>
        </>
      )}
    </main>
  );
}