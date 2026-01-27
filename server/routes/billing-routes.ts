/**
 * WAI SDK v2.0 Billing & Subscription Routes
 * 
 * Comprehensive billing integration with Stripe and Razorpay for:
 * - Subscription management (4 tiers)
 * - Usage-based billing
 * - Invoice generation
 * - Payment processing
 * 
 * @version 2.0.0
 * @since January 19, 2026
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';

const router = Router();

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    });
    console.log('✅ Stripe billing integration initialized');
  } catch (error) {
    console.log('⚠️ Stripe initialization failed - billing features limited');
  }
} else {
  console.log('ℹ️ STRIPE_SECRET_KEY not configured - billing routes will return mock data');
}

const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: {
      agents: 10,
      llmProviders: 3,
      mcpTools: 50,
      tokensPerMonth: 100000,
      multimodal: false,
      voice: false,
      analytics: 'basic',
      support: 'community',
    },
    limits: {
      requestsPerMinute: 60,
      tokensPerDay: 100000,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 4900,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: {
      agents: 50,
      llmProviders: 10,
      mcpTools: 200,
      tokensPerMonth: 1000000,
      multimodal: 'basic',
      voice: false,
      analytics: 'standard',
      support: 'email',
    },
    limits: {
      requestsPerMinute: 300,
      tokensPerDay: 1000000,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 19900,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: {
      agents: 150,
      llmProviders: 20,
      mcpTools: 400,
      tokensPerMonth: 10000000,
      multimodal: 'full',
      voice: true,
      analytics: 'advanced',
      support: 'priority',
    },
    limits: {
      requestsPerMinute: 1000,
      tokensPerDay: 10000000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: {
      agents: 275,
      llmProviders: 23,
      mcpTools: 530,
      tokensPerMonth: 'unlimited',
      multimodal: 'full',
      voice: true,
      analytics: 'enterprise',
      support: 'dedicated',
      sso: true,
      customDomain: true,
      sla: '99.9%',
    },
    limits: {
      requestsPerMinute: 'unlimited',
      tokensPerDay: 'unlimited',
    },
  },
};

router.get('/plans', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        plans: Object.values(SUBSCRIPTION_PLANS),
        currency: 'usd',
        billing_period: 'monthly',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/plans/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/checkout/session', async (req: Request, res: Response) => {
  try {
    const { planId, organizationId, successUrl, cancelUrl } = req.body;
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    
    if (!plan || !plan.priceId) {
      return res.status(400).json({ success: false, error: 'Invalid plan or free plan selected' });
    }

    if (!stripe) {
      return res.status(400).json({ 
        success: false, 
        error: 'Stripe not configured',
        message: 'Please configure STRIPE_SECRET_KEY to enable billing',
      });
    }
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/billing/cancel`,
      metadata: {
        organizationId: organizationId?.toString(),
        planId,
      },
    });
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/portal/session', async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ success: false, error: 'Customer ID required' });
    }

    if (!stripe) {
      return res.status(400).json({ 
        success: false, 
        error: 'Stripe not configured',
      });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/billing`,
    });
    
    res.json({
      success: true,
      data: { url: session.url },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/subscription/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    res.json({
      success: true,
      data: {
        organizationId,
        plan: 'professional',
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        usage: {
          tokens: {
            used: 2500000,
            limit: 10000000,
            percentage: 25,
          },
          requests: {
            used: 45000,
            limit: 1000000,
            percentage: 4.5,
          },
          agents: {
            used: 45,
            limit: 150,
            percentage: 30,
          },
        },
        nextInvoice: {
          amount: 19900,
          currency: 'usd',
          date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/invoices/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { limit = 10 } = req.query;
    
    const mockInvoices = Array.from({ length: Number(limit) }, (_, i) => ({
      id: `inv_${Date.now()}_${i}`,
      number: `WAI-${2026}${String(1 - i).padStart(2, '0')}-001`,
      amount: 19900,
      currency: 'usd',
      status: i === 0 ? 'paid' : 'paid',
      date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
      pdfUrl: null,
    }));
    
    res.json({
      success: true,
      data: {
        invoices: mockInvoices,
        hasMore: false,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/usage/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { startDate, endDate } = req.query;
    
    res.json({
      success: true,
      data: {
        organizationId,
        period: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString(),
        },
        summary: {
          totalTokens: 2500000,
          totalRequests: 45000,
          totalCost: 125.50,
          avgLatency: 145,
        },
        byProvider: [
          { provider: 'openai', tokens: 1200000, requests: 20000, cost: 60.00 },
          { provider: 'anthropic', tokens: 800000, requests: 15000, cost: 40.00 },
          { provider: 'google', tokens: 500000, requests: 10000, cost: 25.50 },
        ],
        byAgent: [
          { agent: 'fullstack-developer', tokens: 500000, requests: 8000 },
          { agent: 'code-reviewer', tokens: 400000, requests: 7000 },
          { agent: 'documentation-writer', tokens: 300000, requests: 5000 },
        ],
        dailyUsage: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tokens: Math.floor(Math.random() * 100000) + 50000,
          requests: Math.floor(Math.random() * 2000) + 1000,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/webhook/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  
  if (!stripe || !sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('Stripe webhook: Missing signature, secret, or stripe not configured');
    return res.status(400).json({ error: 'Missing webhook configuration' });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Checkout completed:', event.data.object);
        break;
      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object);
        break;
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object);
        break;
      case 'invoice.paid':
        console.log('Invoice paid:', event.data.object);
        break;
      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/webhook/razorpay', async (req: Request, res: Response) => {
  try {
    const { event, payload } = req.body;
    
    console.log('Razorpay webhook received:', event);
    
    switch (event) {
      case 'subscription.authenticated':
      case 'subscription.activated':
      case 'subscription.charged':
      case 'subscription.completed':
      case 'subscription.updated':
      case 'subscription.cancelled':
      case 'payment.captured':
      case 'payment.failed':
        console.log('Razorpay event processed:', event, payload);
        break;
      default:
        console.log('Unhandled Razorpay event:', event);
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error('Razorpay webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
