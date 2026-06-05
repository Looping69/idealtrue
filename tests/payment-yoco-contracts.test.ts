import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import { DEFAULT_ENCORE_API_URL } from '../src/lib/encore-client';
import {
  createManagedHostingCheckout,
  startBillingPayment,
  type HostPlan,
} from '../src/lib/billing-client';
import { workflowBilling } from './fixtures/workflows';

type FetchCall = {
  url: string;
  init?: RequestInit;
};

let fetchCalls: FetchCall[] = [];

function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function installFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  fetchCalls = [];
  Object.defineProperty(globalThis, 'fetch', {
    value: async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      fetchCalls.push({ url, init });
      return handler(url, init);
    },
    configurable: true,
    writable: true,
  });
}

function requestBody(index: number) {
  return JSON.parse(String(fetchCalls[index]?.init?.body || '{}')) as Record<string, unknown>;
}

afterEach(() => {
  fetchCalls = [];
});

test('subscription payment client posts plan interval through the standard Yoco endpoint', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/payments')) {
      return createJsonResponse({
        paymentId: 'payment-subscription-1',
        provider: 'yoco',
        providerMode: 'test',
        status: 'pending',
        redirectUrl: 'https://pay.example/subscription',
        providerReference: 'checkout-subscription-1',
      });
    }
    throw new Error(`Unhandled subscription endpoint: ${url}`);
  });

  const checkout = await startBillingPayment({ purpose: 'subscription', plan: 'professional', billingInterval: 'monthly' });

  assert.equal(checkout.redirectUrl, 'https://pay.example/subscription');
  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/billing/payments`);
  assert.deepEqual(requestBody(0), { purpose: 'subscription', plan: 'professional', billingInterval: 'monthly' });
});

test('subscription checkout client supports all subscription plans and billing intervals', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/payments')) {
      const body = requestBody(fetchCalls.length - 1);
      return createJsonResponse({
        paymentId: `payment-${body.plan}-${body.billingInterval}`,
        provider: 'yoco',
        providerMode: 'test',
        status: 'pending',
        redirectUrl: `https://pay.example/${body.plan}-${body.billingInterval}`,
        providerReference: `checkout-${body.plan}-${body.billingInterval}`,
      });
    }
    throw new Error(`Unhandled subscription matrix endpoint: ${url}`);
  });

  const scenarios: Array<[HostPlan, 'monthly' | 'annual']> = [
    ['standard', 'monthly'],
    ['professional', 'annual'],
    ['premium', 'monthly'],
  ];

  for (const [plan, billingInterval] of scenarios) {
    const checkout = await startBillingPayment({ purpose: 'subscription', plan, billingInterval });
    assert.equal(checkout.redirectUrl, `https://pay.example/${plan}-${billingInterval}`);
  }

  assert.deepEqual(
    fetchCalls.map((call) => JSON.parse(String(call.init?.body || '{}'))),
    scenarios.map(([plan, billingInterval]) => ({ purpose: 'subscription', plan, billingInterval })),
  );
});

test('standard billing payment client creates all new Yoco payments through one endpoint', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/payments')) {
      const body = requestBody(fetchCalls.length - 1);
      return createJsonResponse({
        paymentId: `payment-${body.purpose}`,
        provider: 'yoco',
        providerMode: 'test',
        status: 'pending',
        redirectUrl: `https://pay.example/${body.purpose}`,
        providerReference: `checkout-${body.purpose}`,
      });
    }
    throw new Error(`Unhandled standard billing payment endpoint: ${url}`);
  });

  const subscription = await startBillingPayment({ purpose: 'subscription', plan: 'professional', billingInterval: 'monthly' });
  const hostSetup = await startBillingPayment({ purpose: 'host_billing_setup' });
  const managed = await startBillingPayment({ purpose: 'managed_hosting' });
  const credits = await startBillingPayment({ purpose: 'content_credits', credits: 10 });

  assert.equal(subscription.redirectUrl, 'https://pay.example/subscription');
  assert.equal(hostSetup.provider, 'yoco');
  assert.equal(managed.redirectUrl, 'https://pay.example/managed_hosting');
  assert.equal(credits.providerMode, 'test');
  assert.deepEqual(requestBody(0), { purpose: 'subscription', plan: 'professional', billingInterval: 'monthly' });
  assert.deepEqual(requestBody(1), { purpose: 'host_billing_setup' });
  assert.deepEqual(requestBody(2), { purpose: 'managed_hosting' });
  assert.deepEqual(requestBody(3), { purpose: 'content_credits', credits: 10 });
  assert.deepEqual(
    fetchCalls.map((call) => `${call.init?.method || 'GET'} ${call.url.replace(DEFAULT_ENCORE_API_URL, '')}`),
    [
      'POST /billing/payments',
      'POST /billing/payments',
      'POST /billing/payments',
      'POST /billing/payments',
    ],
  );
});

test('managed hosting checkout client creates a managed-hosting Yoco payment', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/payments')) {
      const body = requestBody(fetchCalls.length - 1);
      return createJsonResponse({
        paymentId: 'payment-managed-hosting-1',
        provider: 'yoco',
        providerMode: 'test',
        status: 'pending',
        redirectUrl: 'https://pay.example/managed-hosting',
        providerReference: 'checkout-managed-hosting-1',
      });
    }
    throw new Error(`Unhandled managed hosting checkout endpoint: ${url}`);
  });

  const checkout = await createManagedHostingCheckout();

  assert.equal(checkout.redirectUrl, 'https://pay.example/managed-hosting');
  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/billing/payments`);
  assert.deepEqual(requestBody(0), { purpose: 'managed_hosting' });
});

test('host billing setup payment client posts through the standard Yoco endpoint', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/payments')) {
      return createJsonResponse({
        paymentId: 'payment-host-setup-1',
        provider: 'yoco',
        providerMode: 'test',
        status: 'pending',
        redirectUrl: 'https://pay.example/host-card-setup',
        providerReference: workflowBilling.hostCardSetupPaid.checkoutId,
      });
    }
    throw new Error(`Unhandled host billing setup endpoint: ${url}`);
  });

  const checkout = await startBillingPayment({ purpose: 'host_billing_setup' });

  assert.equal(checkout.redirectUrl, 'https://pay.example/host-card-setup');
  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/billing/payments`);
  assert.equal(fetchCalls[0]?.init?.method, 'POST');
  assert.deepEqual(requestBody(0), { purpose: 'host_billing_setup' });
});
