import { getDocsUrls } from "../src/docs.js";

describe("docs integration", () => {
  describe("getDocsUrls", () => {
    it("should fetch documentation URLs from BugSplat sitemap", async () => {
      const urls = await getDocsUrls();

      expect(urls).toBeDefined();
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBeGreaterThan(0);

      urls.forEach((url) => {
        expect(typeof url).toBe("string");
        expect(url).toMatch(/^https:\/\/docs\.bugsplat\.com/);
        expect(url).toMatch(/\.md$/);
      });
    });

    it("should exclude the root documentation URL", async () => {
      const urls = await getDocsUrls();

      const rootUrl = urls.find(url => url === "https://docs.bugsplat.com.md");
      expect(rootUrl).toBeUndefined();
    });

    it("should include specific documentation URLs", async () => {
      const urls = await getDocsUrls();

      const gettingStartedUrl = urls.find(url =>
        url === "https://docs.bugsplat.com/introduction/getting-started.md"
      );
      expect(gettingStartedUrl).toBeDefined();
    });

    it("should handle network errors gracefully", async () => {
      const originalFetch = global.fetch;
      global.fetch = jasmine.createSpy('fetch').and.rejectWith(new Error('Network error'));

      try {
        await expectAsync(getDocsUrls()).toBeRejectedWithError('Network error');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should handle HTTP errors gracefully", async () => {
      const originalFetch = global.fetch;
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      global.fetch = jasmine.createSpy('fetch').and.resolveTo(mockResponse);

      try {
        await expectAsync(getDocsUrls()).toBeRejectedWithError('Failed to fetch sitemap: 404 Not Found');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
