import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import { DEFAULT_ENCORE_API_URL } from '../src/lib/encore-client';
import {
  createHostBillingSetupCheckout,
  createHostBillingSetupPaymentLink,
  createSubscriptionCheckout,
  createSubscriptionPaymentLink,
  getCheckoutStatus,
  getPaymentLinkStatus,
  startBillingPayment,
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

test('subscription checkout client posts plan interval and reads checkout status explicitly', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/subscriptions/checkout')) {
      return createJsonResponse({ checkoutId: 'checkout-subscription-1', redirectUrl: 'https://pay.example/subscription' });
    }
    if (url.endsWith('/billing/checkouts/checkout-subscription-1')) {
      return createJsonResponse({ status: 'pending', checkoutType: 'subscription' });
    }
    throw new Error(`Unhandled subscription endpoint: ${url}`);
  });

  const checkout = await createSubscriptionCheckout('professional', 'monthly');
  const status = await getCheckoutStatus(checkout.checkoutId);

  assert.equal(checkout.redirectUrl, 'https://pay.example/subscription');
  assert.equal(status.checkoutType, 'subscription');
  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/billing/subscriptions/checkout`);
  assert.deepEqual(requestBody(0), { plan: 'professional', billingInterval: 'monthly' });
});

test('subscription payment link client creates a server-owned Yoco payment link session', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/subscriptions/payment-link')) {
      return createJsonResponse({
        sessionId: 'payment-link-subscription-1',
        paymentLinkId: 'plink-subscription-1',
        orderId: 'order-subscription-1',
        redirectUrl: 'https://pay.example/payment-link-subscription',
        providerMode: 'test',
      });
    }
    if (url.endsWith('/billing/payment-links/payment-link-subscription-1')) {
      return createJsonResponse({ status: 'pending', sessionType: 'subscription' });
    }
    throw new Error(`Unhandled subscription payment link endpoint: ${url}`);
  });

  const paymentLink = await createSubscriptionPaymentLink('professional', 'monthly');
  const status = await getPaymentLinkStatus(paymentLink.sessionId);

  assert.equal(paymentLink.redirectUrl, 'https://pay.example/payment-link-subscription');
  assert.equal(paymentLink.providerMode, 'test');
  assert.equal(status.sessionType, 'subscription');
  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/billing/subscriptions/payment-link`);
  assert.deepEqual(requestBody(0), { plan: 'professional', billingInterval: 'monthly' });
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
  const credits = await startBillingPayment({ purpose: 'content_credits', credits: 10 });

  assert.equal(subscription.redirectUrl, 'https://pay.example/subscription');
  assert.equal(hostSetup.provider, 'yoco');
  assert.equal(credits.providerMode, 'test');
  assert.deepEqual(requestBody(0), { purpose: 'subscription', plan: 'professional', billingInterval: 'monthly' });
  assert.deepEqual(requestBody(1), { purpose: 'host_billing_setup' });
  assert.deepEqual(requestBody(2), { purpose: 'content_credits', credits: 10 });
  assert.deepEqual(
    fetchCalls.map((call) => `${call.init?.method || 'GET'} ${call.url.replace(DEFAULT_ENCORE_API_URL, '')}`),
    [
      'POST /billing/payments',
      'POST /billing/payments',
      'POST /billing/payments',
    ],
  );
});

test('host billing setup checkout client posts to the dedicated Yoco-backed setup endpoint', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/host/setup-checkout')) {
      return createJsonResponse({
        checkoutId: workflowBilling.hostCardSetupPaid.checkoutId,
        redirectUrl: 'https://pay.example/host-card-setup',
      });
    }
    if (url.endsWith(`/billing/checkouts/${workflowBilling.hostCardSetupPaid.checkoutId}`)) {
      return createJsonResponse({
        status: workflowBilling.hostCardSetupPaid.status,
        checkoutType: workflowBilling.hostCardSetupPaid.checkoutType,
      });
    }
    throw new Error(`Unhandled host billing setup endpoint: ${url}`);
  });

  const checkout = await createHostBillingSetupCheckout();
  const status = await getCheckoutStatus(checkout.checkoutId);

  assert.equal(checkout.redirectUrl, 'https://pay.example/host-card-setup');
  assert.equal(status.checkoutType, 'host_billing_setup');
  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/billing/host/setup-checkout`);
  assert.equal(fetchCalls[0]?.init?.method, 'POST');
});

test('host billing setup payment link client posts to the payment-link endpoint', async () => {
  installFetch((url) => {
    if (url.endsWith('/billing/host/setup-payment-link')) {
      return createJsonResponse({
        sessionId: 'payment-link-host-card-setup',
        paymentLinkId: 'plink-host-card-setup',
        orderId: 'order-host-card-setup',
        redirectUrl: 'https://pay.example/payment-link-host-card-setup',
        providerMode: 'test',
      });
    }
    if (url.endsWith('/billing/payment-links/payment-link-host-card-setup')) {
      return createJsonResponse({ status: 'pending', sessionType: 'host_billing_setup' });
    }
    throw new Error(`Unhandled host billing payment link endpoint: ${url}`);
  });

  const paymentLink = await createHostBillingSetupPaymentLink();
  const status = await getPaymentLinkStatus(paymentLink.sessionId);

  assert.equal(paymentLink.redirectUrl, 'https://pay.example/payment-link-host-card-setup');
  assert.equal(paymentLink.providerMode, 'test');
  assert.equal(status.sessionType, 'host_billing_setup');
  assert.equal(fetchCalls[0]?.url, `${DEFAULT_ENCORE_API_URL}/billing/host/setup-payment-link`);
  assert.equal(fetchCalls[0]?.init?.method, 'POST');
});
