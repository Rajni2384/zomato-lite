import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  const sql = neon(process.env.DATABASE_URL!);

  // Parse the JSON body the frontend handed over
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Send a valid JSON body, e.g. { "restaurantId": 1, "rating": 4, "comment": "Great" }.' },
      { status: 400 }
    );
  }

  const { restaurantId, rating, comment } = body as {
    restaurantId: number;
    rating: number;
    comment: string;
  };

  // Check 1 — is rating a whole number from 1 to 5?
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { error: "Rating must be a whole number from 1 to 5." },
      { status: 400 }
    );
  }

  // Check 2 — is the comment non-empty after trimming whitespace?
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return Response.json(
      { error: "Comment must be a non-empty message." },
      { status: 400 }
    );
  }

  // Check 3 — does this restaurant actually exist? (a database lookup)
  if (typeof restaurantId !== "number") {
    return Response.json(
      { error: "Restaurant does not exist." },
      { status: 400 }
    );
  }
  const restaurant = await sql.query(
    "SELECT id FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (restaurant.length === 0) {
    return Response.json(
      { error: "Restaurant does not exist." },
      { status: 400 }
    );
  }

  // All checks passed — insert exactly one row. Nothing else in the database changes.
  const inserted = await sql.query(
    "INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id",
    [restaurantId, rating, comment.trim()]
  );

  return Response.json(
    { success: true, reviewId: Number(inserted[0].id) },
    { status: 201 }
  );
}