const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createPrices() {
  try {
    console.log('Creating Stripe prices...\n');

    // Hobby Monthly (Free)
    const hobbyMonthly = await stripe.prices.create({
      product: process.env.STRIPE_HOBBY_PRODUCT_ID,
      unit_amount: 0, // Free
      currency: 'usd',
      recurring: { interval: 'month' },
      nickname: 'Hobby Monthly',
    });
    console.log('✅ Hobby Monthly:', hobbyMonthly.id);

    // Pro Monthly
    const proMonthly = await stripe.prices.create({
      product: process.env.STRIPE_PRO_PRODUCT_ID,
      unit_amount: 2000, // $20.00
      currency: 'usd',
      recurring: { interval: 'month' },
      nickname: 'Pro Monthly',
    });
    console.log('✅ Pro Monthly:', proMonthly.id);

    // Pro Yearly (with discount)
    const proYearly = await stripe.prices.create({
      product: process.env.STRIPE_PRO_PRODUCT_ID,
      unit_amount: 20000, // $200.00 (save $40)
      currency: 'usd',
      recurring: { interval: 'year' },
      nickname: 'Pro Yearly',
    });
    console.log('✅ Pro Yearly:', proYearly.id);

    // Usage Product (metered billing)
    const usageMonthly = await stripe.prices.create({
      product: process.env.STRIPE_USAGE_PRODUCT_ID,
      currency: 'usd',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
      },
      billing_scheme: 'per_unit',
      unit_amount: 10, // $0.10 per credit
      nickname: 'Usage Monthly',
    });
    console.log('✅ Usage Monthly:', usageMonthly.id);

    const usageYearly = await stripe.prices.create({
      product: process.env.STRIPE_USAGE_PRODUCT_ID,
      currency: 'usd',
      recurring: {
        interval: 'year',
        usage_type: 'metered',
      },
      billing_scheme: 'per_unit',
      unit_amount: 10, // $0.10 per credit
      nickname: 'Usage Yearly',
    });
    console.log('✅ Usage Yearly:', usageYearly.id);

    console.log('\n✅ All prices created successfully!');
  } catch (error) {
    console.error('❌ Error creating prices:', error.message);
    process.exit(1);
  }
}

createPrices();
