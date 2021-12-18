import { query } from "faunadb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";

type FaunaUser = {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
};

export default async function Subscribe(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method === "POST") {
    const session = await getSession({ req: request });
    const faunaUser = await fauna.query<FaunaUser>(
      query.Get(
        query.Match(
          query.Index("user_by_email"),
          query.Casefold(session.user.email)
        )
      )
    );
    let customerId = faunaUser.data.stripe_customer_id;
    if (!customerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
      });
      await fauna.query(
        query.Update(query.Ref(query.Collection("users"), faunaUser.ref.id), {
          data: {
            stripe_customer_id: stripeCustomer.id,
          },
        })
      );
      customerId = stripeCustomer.id;
    }
    const checkoutSession = await stripe.checkout.sessions.create({
      cancel_url: process.env.STRIPE_CANCEL_URL,
      success_url: process.env.STRIPE_SUCCESS_URL,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [{ price: "price_1K3WfYDfwckTtD0VKAY1ES2X", quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      customer: customerId,
    });
    return response.status(200).json({ sessionId: checkoutSession.id });
  } else {
    response.setHeader("Allow", "POST");
    return response.status(405).end("Method not allowed");
  }
}
