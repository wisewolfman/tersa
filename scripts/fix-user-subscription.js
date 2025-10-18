const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixUserSubscription() {
  try {
    // Get current user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw userError;
    
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`\nChecking user: ${user.email} (${user.id})`);
      
      // Find Stripe customer by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (customers.data.length === 0) {
        console.log('  ❌ No Stripe customer found');
        continue;
      }
      
      const customer = customers.data[0];
      console.log(`  ✅ Found Stripe customer: ${customer.id}`);
      
      // Get active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      });
      
      if (subscriptions.data.length === 0) {
        console.log('  ❌ No active subscription');
        continue;
      }
      
      const subscription = subscriptions.data[0];
      const productId = subscription.items.data[0]?.price.product;
      
      console.log(`  ✅ Found subscription: ${subscription.id}`);
      console.log(`  ✅ Product: ${productId}`);
      
      // Update profile in database using direct SQL
      const { error: updateError } = await supabase
        .from('profile')
        .update({
          customer_id: customer.id,
          subscription_id: subscription.id,
          product_id: productId
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.log(`  ❌ Error updating profile: ${updateError.message}`);
      } else {
        console.log('  ✅ Profile updated successfully!');
      }
    }
    
    console.log('\n✅ All users processed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserSubscription();
