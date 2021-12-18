import { query } from "faunadb";
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction: boolean,
) {
  const userRef = await fauna.query(
    query.Select(
      'ref',
      query.Get(
        query.Match(
          query.Index('user_by_stripe_customer_id'),
          customerId,
        ),
      ),
    ),
  );

  console.log('user REF: userRef')

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    priceId: subscription.items.data[0].price.id,
  };

  console.log('subscriptionData:', subscriptionData);

  console.log('createAction:', createAction);

  if (createAction) {
    console.log('entrou no create');
    await fauna.query(
      query.Create(
        query.Collection('subscriptions'),
        { data: subscriptionData },
      ),
    );
  } else {
    console.log('não entrou no create');
    await fauna.query(
      query.Replace(
        query.Select(
          'ref',
          query.Get(
            query.Match(
              query.Index('subscription_by_id'),
              subscriptionId,
            ),
          ),
        ),
        { data: subscriptionData },
      ),
    );
  };

  console.log('cabo subscription');
}; 