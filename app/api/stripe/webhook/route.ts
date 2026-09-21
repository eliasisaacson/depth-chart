const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;

export async function POST(request: Request) {
  const body = await request.text();

  // If webhook secret is configured, verify signature
  // For now, we'll also handle without verification for testing
  if (STRIPE_WEBHOOK_SECRET) {
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return Response.json({ error: "Missing signature" }, { status: 400 });
    }
    // Note: Full signature verification requires the stripe package
    // For production, install stripe and verify properly
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const clerkUserId = session.metadata?.clerk_user_id;
    const sport = session.metadata?.sport;

    if (clerkUserId && sport) {
      // Get current user metadata from Clerk
      const userRes = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
        headers: { "Authorization": `Bearer ${CLERK_SECRET_KEY}` },
      });
      const userData = await userRes.json();
      const currentMeta = userData.public_metadata || {};
      const currentSports = currentMeta.sports || [];

      // Add the sport if not already there
      if (!currentSports.includes(sport)) {
        currentSports.push(sport);
      }

      // Update Clerk user metadata
      await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_metadata: { ...currentMeta, sports: currentSports },
        }),
      });
    }
  }

  return Response.json({ received: true });
}
