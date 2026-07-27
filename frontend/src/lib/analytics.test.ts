import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  posthog: {
    init: vi.fn(),
    identify: vi.fn(),
    register: vi.fn(),
    capture: vi.fn(),
  },
  getBase: vi.fn(() => 'http://localhost:8000'),
}));

vi.mock('posthog-js', () => ({ default: mocks.posthog }));
vi.mock('./api', () => ({ getBase: mocks.getBase }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function identityResponse(enabled: boolean) {
  return {
    ok: true,
    json: async () => ({
      enabled,
      anon_id: enabled ? 'anonymous-install-id' : '',
      host: 'https://analytics.example.test',
      key: enabled ? 'public-project-key' : '',
    }),
  };
}

describe('analytics opt-in', () => {
  it('does not initialize or capture when the backend disables analytics', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(identityResponse(false)));
    const analytics = await import('./analytics');

    await analytics.initAnalytics();
    analytics.track('app_opened');

    expect(mocks.posthog.init).not.toHaveBeenCalled();
    expect(mocks.posthog.identify).not.toHaveBeenCalled();
    expect(mocks.posthog.register).not.toHaveBeenCalled();
    expect(mocks.posthog.capture).not.toHaveBeenCalled();
    expect(analytics.isAnalyticsEnabled()).toBe(false);
  });

  it('initializes and captures only after an explicit enabled response', async () => {
    mocks.posthog.init.mockImplementation(
      (_key: string, options: { loaded?: () => void }) => options.loaded?.(),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(identityResponse(true)));
    const analytics = await import('./analytics');

    await analytics.initAnalytics();
    analytics.track('app_opened');

    expect(mocks.posthog.init).toHaveBeenCalledOnce();
    expect(mocks.posthog.identify).toHaveBeenCalledWith('anonymous-install-id');
    expect(mocks.posthog.capture).toHaveBeenCalledWith('app_opened', {});
    expect(analytics.isAnalyticsEnabled()).toBe(true);
  });
});
