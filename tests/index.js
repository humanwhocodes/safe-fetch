/**
 * @fileoverview Tests for safe-fetch
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import assert from "node:assert";
import { createSafeFetch, safeFetch, ERROR_STATUS } from "../dist/index.js";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("ERROR_STATUS", () => {
	it("should be exported as a constant", () => {
		assert.strictEqual(typeof ERROR_STATUS, "number");
	});

	it("should have the value 10001", () => {
		assert.strictEqual(ERROR_STATUS, 10001);
	});
});

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

	it("should return Response with status equal to ERROR_STATUS when fetch throws an error", async () => {
		const errorMessage = "Network error occurred";
		const mockFetch = async () => {
			throw new Error(errorMessage);
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		assert.strictEqual(response.status, ERROR_STATUS);
		assert.strictEqual(response.statusText, errorMessage);
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

	it("should handle string errors", async () => {
		const errorMessage = "String error message";
		const mockFetch = async () => {
			throw errorMessage;
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		assert.strictEqual(response.status, 10001);
		assert.strictEqual(response.statusText, errorMessage);
	});

	it("should serialize string errors as JSON in response body", async () => {
		const errorMessage = "String error message";
		const mockFetch = async () => {
			throw errorMessage;
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		const body = await response.json();

		assert.deepStrictEqual(body, { message: errorMessage });
	});

	it("should serialize Error object properties as JSON in response body", async () => {
		const errorMessage = "Network error occurred";
		const mockFetch = async () => {
			throw new Error(errorMessage);
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		const body = await response.json();

		assert.strictEqual(body.message, errorMessage);
		assert.ok("stack" in body);
	});

	it("should serialize custom error object with additional properties", async () => {
		const mockFetch = async () => {
			const error = new Error("Custom error");
			error.code = "ERR_CUSTOM";
			error.statusCode = 500;
			throw error;
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		const body = await response.json();

		assert.strictEqual(body.message, "Custom error");
		assert.strictEqual(body.code, "ERR_CUSTOM");
		assert.strictEqual(body.statusCode, 500);
		assert.ok("stack" in body);
	});

	it("should serialize TypeError properties as JSON in response body", async () => {
		const errorMessage = "Failed to fetch";
		const mockFetch = async () => {
			throw new TypeError(errorMessage);
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		const body = await response.json();

		assert.strictEqual(body.message, errorMessage);
		assert.ok("stack" in body);
	});

	it("should serialize plain object errors as JSON in response body", async () => {
		const errorObject = {
			message: "Plain object error",
			code: 123,
			details: "Some details",
		};
		const mockFetch = async () => {
			throw errorObject;
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		const body = await response.json();

		assert.deepStrictEqual(body, errorObject);
	});

	it("should handle circular references in error objects", async () => {
		const mockFetch = async () => {
			const error = new Error("Circular reference error");
			error.self = error; // Create circular reference
			throw error;
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		const body = await response.json();

		// Should fallback to simple message format
		assert.strictEqual(body.message, "Circular reference error");
	});

	it("should skip non-serializable properties like functions", async () => {
		const mockFetch = async () => {
			const error = new Error("Error with function");
			error.myFunction = () => {
				return "test";
			};
			error.normalProp = "value";
			throw error;
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		const body = await response.json();

		assert.strictEqual(body.message, "Error with function");
		assert.strictEqual(body.normalProp, "value");
		assert.ok(!("myFunction" in body));
	});

	it("should set Content-Type header to application/json", async () => {
		const mockFetch = async () => {
			throw new Error("Test error");
		};
		const safe = createSafeFetch(mockFetch);
		const response = await safe("https://example.com");

		assert.strictEqual(
			response.headers.get("Content-Type"),
			"application/json",
		);
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
