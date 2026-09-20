import { neon } from "@neondatabase/serverless";
import type { NextRequest } from "next/server";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/restaurants/[id]">) {
  const sql = neon(process.env.DATABASE_URL!);
  const { id } = await ctx.params;

  const restaurantId = Number(id);
  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return Response.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const restaurant = await sql.query(
    "SELECT id, name, cuisine, area FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (restaurant.length === 0) {
    return Response.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const name = restaurant[0].name as string;
  const cuisine = restaurant[0].cuisine as string;
  const area = restaurant[0].area as string;

  // ---- The three lines of intelligence: store facts, compute answers ----
  // 1. The average — added up and divided, right now:
  const avgRow = await sql.query(
    "SELECT AVG(rating)::float AS average FROM reviews WHERE restaurant_id = $1",
    [restaurantId]
  );
  // 2. How many reviews in total:
  const countRow = await sql.query(
    "SELECT COUNT(*) AS count FROM reviews WHERE restaurant_id = $1",
    [restaurantId]
  );
  // 3. The newest review — sorted by creation time, take one:
  const latestRows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 1",
    [restaurantId]
  );
  // Every remaining review, newest first (the page shows the latest one separately):
  const olderRows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC OFFSET 1",
    [restaurantId]
  );

  // Round to one decimal place here, in the backend — the frontend never does maths.
  const average = avgRow[0].average as number | null;
  const averageRating = average === null ? null : Math.round(average * 10) / 10;
  const totalReviews = Number(countRow[0].count);

  const toReview = (row: Record<string, unknown>) => ({
    id: Number(row.id),
    rating: Number(row.rating),
    comment: row.comment as string,
    createdAt: new Date(row.created_at as string).toISOString(),
  });

  return Response.json({
    name,
    cuisine,
    area,
    averageRating,
    totalReviews,
    // When there are no reviews at all: null, 0, null, and an empty list.
    latestReview: latestRows.length === 0 ? null : toReview(latestRows[0]),
    reviews: olderRows.map(toReview),
  });
}