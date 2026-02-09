import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Register
    if (url.pathname === '/api/register' && request.method === 'POST') {
      const { email, password } = await request.json();
      const hash = await bcrypt.hash(password, 10);
      try {
        await env.DB.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').bind(email, hash).run();
        return new Response(JSON.stringify({ message: 'Registered successfully' }), { status: 200 });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 409 });
      }
    }

    // Login
    if (url.pathname === '/api/login' && request.method === 'POST') {
      const { email, password } = await request.json();
      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      if (user && await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign({ id: user.id, status: user.subscription_status }, env.JWT_SECRET, { expiresIn: '1d' });
        return new Response(JSON.stringify({ token }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
    }

    // Check rate limit (called before any tool run)
    if (url.pathname === '/api/check-rate' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Login required' }), { status: 401 });
      }
      try {
        const token = auth.split(' ')[1];
        const { id, status } = jwt.verify(token, env.JWT_SECRET);
        const today = new Date().toISOString().split('T')[0];
        const log = await env.DB.prepare('SELECT run_count FROM usage_logs WHERE user_id = ? AND tool_run_date = ?').bind(id, today).first();
        const count = log ? log.run_count : 0;
        const limit = status === 'pro' ? 25 : 5;
        const remaining = limit - count;

        if (remaining <= 0) {
          return new Response(JSON.stringify({
            upgrade: true,
            message: `You've reached your daily limit (${limit} runs). Upgrade to Pro for 25 runs/day, deeper AI fixes, competitive gaps, and predictive forecasting.`,
            pro_price: '$48/year'
          }), { status: 200 });
        }

        await env.DB.prepare('INSERT OR REPLACE INTO usage_logs (user_id, tool_run_date, run_count) VALUES (?, ?, ?)').bind(id, today, count + 1).run();

        return new Response(JSON.stringify({
          allowed: true,
          remaining: remaining - 1,
          message: remaining <= 2 ? `Only ${remaining - 1} free runs left today — upgrade for more power!` : null
        }), { status: 200 });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token — please login again' }), { status: 401 });
      }
    }

    // Create Stripe Checkout session
    if (url.pathname === '/api/upgrade' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      const token = auth.split(' ')[1];
      const { id } = jwt.verify(token, env.JWT_SECRET);

      const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-29' });
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
        success_url: 'https://traffictorch.net/?payment=success',
        cancel_url: 'https://traffictorch.net/?payment=cancel',
        client_reference_id: id.toString(),
      });

      return new Response(JSON.stringify({ url: session.url }), { status: 200 });
    }

    // Stripe webhook for payment confirmation
    if (url.pathname === '/api/webhook' && request.method === 'POST') {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-29' });
      const payload = await request.text();
      const sig = request.headers.get('stripe-signature');
      try {
        const event = stripe.webhooks.constructEvent(payload, sig, env.STRIPE_WEBHOOK_SECRET);
        if (event.type === 'checkout.session.completed') {
          const userId = event.data.object.client_reference_id;
          await env.DB.prepare('UPDATE users SET subscription_status = "pro" WHERE id = ?').bind(userId).run();
        }
        return new Response('Webhook received', { status: 200 });
      } catch (err) {
        return new Response(`Webhook error: ${err.message}`, { status: 400 });
      }
    }

    return new Response('Not found', { status: 404 });
  }
};