import { auth, currentUser } from "@clerk/nextjs/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const PRICE_ID = "price_1UHs1sJEsDZ704OXE9nxW9el";

export async function POST(request: Request) {
  // Require auth
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  // Check if user already has NBA access
  const meta = (user?.publicMetadata || {}) as Record<string, any>;
  const sports = meta.sports || [];
  if (sports.includes("nba")) {
    return Response.json({ error: "Already purchased", url: "/draft/nba" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "https://depthchartsports.app";

  // Create Stripe Checkout Session
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${origin}/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${origin}/draft/nba`);
  params.append("line_items[0][price]", PRICE_ID);
  params.append("line_items[0][quantity]", "1");
  params.append("metadata[clerk_user_id]", userId);
  params.append("metadata[sport]", "nba");
  if (email) params.append("customer_email", email);
  params.append("managed_payments[enabled]", "false");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const session = await response.json();

  if (session.error) {
    return Response.json({ error: session.error.message }, { status: 400 });
  }

  return Response.json({ url: session.url });
}
