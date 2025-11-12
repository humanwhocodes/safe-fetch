/**
 * @fileoverview Main entry point for the project.
 * @author Nicholas C. Zakas
 */

/* @ts-self-types="./index.d.ts" */

/**
 * The status code used to indicate an error occurred during fetch.
 * @type {number}
 */
export const ERROR_STATUS = 10001;

/**
 * Creates a safe version of fetch that doesn't reject on errors.
 * @param {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} fetch The fetch function to wrap
 * @returns {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} A wrapped fetch function that returns Response objects instead of rejecting
 */
export function createSafeFetch(fetch) {
	return (url, init) => {
		return fetch(url, init).catch(error => {
			// Serialize error to JSON
			/** @type {Record<string, any>} */
			let errorObject;
			const errorMessage =
				typeof error === "string" ? error : error.message || "Unknown error";

			if (typeof error === "string") {
				errorObject = { message: error };
			} else {
				// Extract all properties from the error object
				errorObject = {};
				const propertyNames = Object.getOwnPropertyNames(error);

				for (const name of propertyNames) {
					try {
						const value = error[name];

						// Skip functions and symbols as they can't be serialized
						if (
							typeof value !== "function" &&
							typeof value !== "symbol"
						) {
							errorObject[name] = value;
						}
					} catch {
						// Skip properties that throw on access
					}
				}
			}

			// Safely stringify with circular reference handling
			let body;

			try {
				body = JSON.stringify(errorObject);
			} catch {
				// Fallback if serialization fails (e.g., circular references)
				body = JSON.stringify({ message: errorMessage });
			}

			// Create a custom Response-like object since ERROR_STATUS is out of valid range
			const response = new Response(body, {
				status: 599,
				statusText: errorMessage,
				headers: {
					"Content-Type": "application/json",
				},
			});

			// Override the status property with a custom value
			Object.defineProperty(response, "status", {
				value: ERROR_STATUS,
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
