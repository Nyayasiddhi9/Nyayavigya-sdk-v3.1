/**
 * Stripe Payments Tool
 * Process payments and manage subscriptions
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Stripe Payments Tool Definition
 */
export const stripePaymentsTool: Tool = {
  id: 'stripe_payments',
  name: 'Stripe Payments',
  description: 'Stripe operations: create charges, subscriptions, customers, invoices, refunds',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action: create_charge, create_subscription, create_customer, etc.',
      required: true,
    },
    {
      name: 'params',
      type: 'object',
      description: 'Action parameters (amount, currency, customer, plan, etc.)',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Stripe API response',
  },
  examples: [
    {
      input: {
        action: 'create_charge',
        params: {
          amount: 2000,
          currency: 'usd',
          source: 'tok_visa',
          description: 'Product purchase',
        },
      },
      output: {
        success: true,
        chargeId: 'ch_1234567890',
        status: 'succeeded',
      },
    },
  ],
};

/**
 * Stripe Payments Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const stripePaymentsExecutor: ToolExecutor = async (params) => {
  const { action, params: actionParams } = params;

  const validActions = [
    'create_charge', 'retrieve_charge', 'refund_charge',
    'create_customer', 'update_customer', 'delete_customer',
    'create_subscription', 'update_subscription', 'cancel_subscription',
    'create_invoice', 'pay_invoice',
    'create_payment_intent', 'confirm_payment_intent',
  ];

  if (!validActions.includes(action)) {
    return {
      success: false,
      error: `action must be one of: ${validActions.join(', ')}`,
    };
  }

  if (!actionParams || typeof actionParams !== 'object') {
    return {
      success: false,
      error: 'params must be an object',
    };
  }

  // Return Stripe configuration for host to execute
  return {
    success: true,
    action: `stripe_${action}`,
    config: actionParams,
    note: 'Stripe API requires Stripe secret key and execution by host environment',
  };
};
