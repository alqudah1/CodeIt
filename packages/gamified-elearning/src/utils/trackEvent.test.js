import { trackEvent } from "./trackEvent";

describe("trackEvent", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("sends only allowlisted events without personal content", async () => {
    localStorage.setItem("token", "test-token");

    await expect(trackEvent("landing_cta_click", "hero-build")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "X-CodeIt-Journey": expect.stringMatching(/^[0-9a-f-]{36}$/i),
        }),
        body: JSON.stringify({ event_name: "landing_cta_click", meta: "hero-build" }),
      })
    );
  });

  test("sends only a fixed acquisition channel", async () => {
    await expect(trackEvent("acquisition_visit", "instagram")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        body: JSON.stringify({ event_name: "acquisition_visit", meta: "instagram" }),
      })
    );
  });

  test("records a fixed learning entry point without lesson content", async () => {
    await expect(trackEvent("learning_start", "lesson-one")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        body: JSON.stringify({ event_name: "learning_start", meta: "lesson-one" }),
      })
    );
  });

  test("sends only the fixed founding offer identifier", async () => {
    await expect(trackEvent("parent_guide_view")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        body: JSON.stringify({ event_name: "parent_guide_view", meta: null }),
      })
    );
  });

  test("records only a fixed project sharing role", async () => {
    await expect(trackEvent("project_share", "viewer")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        body: JSON.stringify({ event_name: "project_share", meta: "viewer" }),
      })
    );
  });

  test("records personalization without sending project content", async () => {
    await expect(trackEvent("project_personalize")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        body: JSON.stringify({ event_name: "project_personalize", meta: null }),
      })
    );
  });

  test("records only a fixed post-save choice", async () => {
    await expect(trackEvent("activation_next_step", "publish")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        body: JSON.stringify({ event_name: "activation_next_step", meta: "publish" }),
      })
    );
  });

  test("records only the account action without project content", async () => {
    await expect(trackEvent("activation_account_gate", "save")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        body: JSON.stringify({ event_name: "activation_account_gate", meta: "save" }),
      })
    );
  });

  test("sends only a fixed parent acquisition action", async () => {
    await expect(trackEvent("parent_cta_click", "pilot-email")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/analytics/event"),
      expect.objectContaining({
        body: JSON.stringify({ event_name: "parent_cta_click", meta: "pilot-email" }),
      })
    );
  });

  test("refuses unknown events before making a request", async () => {
    await expect(trackEvent("prompt_submitted", "private prompt")).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("never interrupts the user flow when analytics is unavailable", async () => {
    global.fetch.mockRejectedValueOnce(new Error("offline"));
    await expect(trackEvent("return_use")).resolves.toBe(false);
  });
});
