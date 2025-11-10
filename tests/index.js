/**
 * @fileoverview Tests for safe-fetch
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";
import { createSafeFetch, safeFetch } from "../dist/index.js";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("createSafeFetch", () => {
	it("should return a function", () => {
		const mockFetch = async () => new Response();
		const safe = createSafeFetch(mockFetch);

		assert.strictEqual(typeof safe, "function");
	});

	it("should return the original response when fetch succeeds", async () => {
		const mockResponse = new Response("test body", {
			status: 200,
			statusText: "OK",
		});
		const mockFetch = async () => mockResponse;
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		assert.strictEqual(response, mockResponse);
		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.statusText, "OK");
	});

	it("should return Response with status 10001 when fetch throws an error", async () => {
		const errorMessage = "Network error occurred";
		const mockFetch = async () => {
			throw new Error(errorMessage);
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		assert.strictEqual(response.status, 10001);
		assert.strictEqual(response.statusText, errorMessage);
		assert.ok(response instanceof Response);
	});

	it("should handle AbortError correctly", async () => {
		const errorMessage = "The operation was aborted";
		const mockFetch = async () => {
			const error = new Error(errorMessage);
			error.name = "AbortError";
			throw error;
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		assert.strictEqual(response.status, 10001);
		assert.strictEqual(response.statusText, errorMessage);
	});

	it("should pass through url and init parameters", async () => {
		let capturedUrl;
		let capturedInit;
		const mockFetch = async (url, init) => {
			capturedUrl = url;
			capturedInit = init;
			return new Response();
		};
		const safe = createSafeFetch(mockFetch);
		const testUrl = "https://example.com/api";
		const testInit = { method: "POST", body: "test" };

		await safe(testUrl, testInit);

		assert.strictEqual(capturedUrl, testUrl);
		assert.strictEqual(capturedInit, testInit);
	});

	it("should handle TypeError with descriptive message", async () => {
		const errorMessage = "Failed to fetch";
		const mockFetch = async () => {
			throw new TypeError(errorMessage);
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		assert.strictEqual(response.status, 10001);
		assert.strictEqual(response.statusText, errorMessage);
	});
});

describe("safeFetch", () => {
	it("should be a function", () => {
		assert.strictEqual(typeof safeFetch, "function");
	});

	it("should handle AbortController signal", async () => {
		const controller = new AbortController();
		controller.abort();

		const response = await safeFetch("https://httpbin.org/delay/5", {
			signal: controller.signal,
		});

		assert.strictEqual(response.status, 10001);
		assert.ok(response.statusText.length > 0);
	});

	it("should succeed with valid URL", async () => {
		// Using a mock since we cannot rely on external network in tests
		const mockFetch = async () =>
			new Response("success", {
				status: 200,
				statusText: "OK",
			});
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.statusText, "OK");
	});
});
