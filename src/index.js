/**
 * @fileoverview Main entry point for the project.
 * @author Nicholas C. Zakas
 */

/* @ts-self-types="./index.d.ts" */

/**
 * Creates a safe version of fetch that doesn't reject on errors.
 * @param {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} fetch The fetch function to wrap
 * @returns {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} A wrapped fetch function that returns Response objects instead of rejecting
 */
export function createSafeFetch(fetch) {
	return (url, init) => {
		return fetch(url, init).catch(error => {
			// Create a custom Response-like object since status 10001 is out of valid range
			const statusText =
				typeof error === "string" ? error : error.message;
			const response = new Response(null, {
				status: 599,
				statusText,
			});

			// Override the status property with a custom value
			Object.defineProperty(response, "status", {
				value: 10001,
				writable: false,
				enumerable: true,
				configurable: true,
			});

			return response;
		});
	};
}

/**
 * A safe version of globalThis.fetch that doesn't reject on errors.
 * @type {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>}
 */
export const safeFetch = createSafeFetch(globalThis.fetch);
