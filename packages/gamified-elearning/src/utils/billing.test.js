import {
  DEFAULT_BILLING_STATE,
  describeRemainingBuilds,
  fetchBillingStatus,
  isPlusMember,
  openBillingPortal,
  startCheckout,
} from './billing';

describe('billing status', () => {
  afterEach(() => { delete global.fetch; });

  test('a signed-out visitor gets the free default without calling the API', async () => {
    global.fetch = jest.fn();
    await expect(fetchBillingStatus(null)).resolves.toEqual(DEFAULT_BILLING_STATE);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('billing stays hidden by default', () => {
    // Until the server says otherwise, no pricing UI should appear at all.
    expect(DEFAULT_BILLING_STATE.billingEnabled).toBe(false);
    expect(DEFAULT_BILLING_STATE.plan).toBe('free');
  });

  test('the server answer is merged over the defaults', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ billingEnabled: true, plan: 'plus', unlimitedAi: true }),
    }));
    const state = await fetchBillingStatus('token');
    expect(state.plan).toBe('plus');
    expect(state.unlimitedAi).toBe(true);
    expect(state.canPublish).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/billing/status'),
      { headers: { Authorization: 'Bearer token' } }
    );
  });

  test('a failed status request surfaces an error rather than a fake plan', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => ({}) }));
    await expect(fetchBillingStatus('token')).rejects.toThrow('Could not load your plan.');
  });
});

describe('checkout and portal', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete window.location;
    window.location = { assign: jest.fn() };
  });
  afterEach(() => {
    window.location = originalLocation;
    delete global.fetch;
  });

  test('checkout sends the parent to the Stripe URL the server returned', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/session_1' }),
    }));
    await startCheckout('token');
    expect(window.location.assign).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/session_1');
  });

  test('a refusal carries the server code so the UI can explain it', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      json: async () => ({ code: 'ADULT_REQUIRED', error: 'Ask a parent or guardian.' }),
    }));
    await expect(startCheckout('token')).rejects.toMatchObject({
      code: 'ADULT_REQUIRED',
      message: 'Ask a parent or guardian.',
    });
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  test('a success response with no URL never navigates', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
    await expect(openBillingPortal('token')).rejects.toThrow();
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});

describe('describeRemainingBuilds', () => {
  const free = { ...DEFAULT_BILLING_STATE, monthlyAiBuilds: 10 };

  test('counts down and uses singular for the last one', () => {
    expect(describeRemainingBuilds({ ...free, buildsThisMonth: 0 })).toBe('10 AI builds left this month');
    expect(describeRemainingBuilds({ ...free, buildsThisMonth: 9 })).toBe('1 AI build left this month');
    expect(describeRemainingBuilds({ ...free, buildsThisMonth: 10 })).toBe('No AI builds left this month');
  });

  test('never goes negative when usage overshoots the cap', () => {
    expect(describeRemainingBuilds({ ...free, buildsThisMonth: 40 })).toBe('No AI builds left this month');
  });

  test('says nothing at all on an unlimited plan or with no data', () => {
    expect(describeRemainingBuilds({ ...free, unlimitedAi: true })).toBeNull();
    expect(describeRemainingBuilds(DEFAULT_BILLING_STATE)).toBeNull();
    expect(describeRemainingBuilds(null)).toBeNull();
  });
});

describe('isPlusMember', () => {
  test('only a plus plan counts', () => {
    expect(isPlusMember({ plan: 'plus' })).toBe(true);
    expect(isPlusMember({ plan: 'free' })).toBe(false);
    expect(isPlusMember(null)).toBe(false);
    // A cancelling member keeps access until the period ends; the server has
    // already decided that, so the client must not second-guess it.
    expect(isPlusMember({ plan: 'plus', cancelAtPeriodEnd: true })).toBe(true);
  });
});
