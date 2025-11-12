# Safe Fetch

by [Nicholas C. Zakas](https://humanwhocodes.com)

If you find this useful, please consider supporting my work with a [donation](https://humanwhocodes.com/donate).

## Description

A fetch wrapper that returns Response objects for errors instead of rejecting. When an error occurs (such as AbortError or network failures), the wrapper returns a Response object with status code 10001 and the error message in the statusText, allowing you to handle errors without try-catch blocks.

## Installation

```shell
npm install @humanwhocodes/safe-fetch
```

## Usage

There are three exports:

### `safeFetch(url, init)`

A drop-in replacement for the global `fetch` function that never rejects:

```javascript
import { safeFetch, ERROR_STATUS } from "@humanwhocodes/safe-fetch";

// Using AbortController
const controller = new AbortController();
controller.abort();

const response = await safeFetch("https://api.example.com/data", {
	signal: controller.signal,
});

if (response.ok) {
	const data = await response.json();
	console.log(data);
} else if (response.status === ERROR_STATUS) {
	// the ERROR_STATUS indicates it's a caught error
	console.error("Error:", response.statusText);
	// "This operation was aborted"

	// You can also access the error details from the response body
	const errorDetails = await response.json();
	console.error("Error details:", errorDetails);
	// { message: "This operation was aborted", stack: "..." }
} else {
	// Handle HTTP errors (non-2xx status codes)
	console.error(`HTTP Error: ${response.status} ${response.statusText}`);
}
```

### `createSafeFetch(fetch)`

A function that wraps any fetch-compatible function to make it safe:

```javascript
import { createSafeFetch, ERROR_STATUS } from "@humanwhocodes/safe-fetch";

// Wrap a custom fetch implementation
const myFetch = (url, init) => {
	// custom fetch logic
};

const mySafeFetch = createSafeFetch(myFetch);

const response = await mySafeFetch("https://api.example.com/data");

if (response.ok) {
	console.log("Success!");
} else if (response.status === ERROR_STATUS) {
	console.error("Error:", response.statusText);

	// Access detailed error information from the response body
	const errorDetails = await response.json();
	console.error("Error details:", errorDetails);
} else {
	// Handle HTTP errors (non-2xx status codes)
	console.error(`HTTP Error: ${response.status} ${response.statusText}`);
}
```

### `ERROR_STATUS`

A constant representing the status code used for caught errors. This eliminates the need to use magic numbers in your code:

```javascript
import { safeFetch, ERROR_STATUS } from "@humanwhocodes/safe-fetch";

const response = await safeFetch("https://api.example.com/data");

if (response.ok) {
	// Handle successful response
	const data = await response.json();
	console.log(data);
} else if (response.status === ERROR_STATUS) {
	console.error("Error:", response.statusText);

	// Get detailed error information from the response body
	const errorDetails = await response.json();
	console.error("Error details:", errorDetails);
} else {
	// Handle HTTP errors (non-2xx status codes)
	console.error(`HTTP Error: ${response.status} ${response.statusText}`);
}
```

The value of `ERROR_STATUS` is `10001`.

## How It Works

The `Response` constructor in JavaScript only accepts status codes in the range 200-599. To work around this limitation, `safe-fetch` creates a `Response` object with status 599 and then uses `Object.defineProperty()` to override the status property with `ERROR_STATUS` (10001).

When a fetch operation fails (network error, abort signal, etc.), instead of rejecting the promise, `safe-fetch` catches the error and returns a Response object with:

- `status`: `ERROR_STATUS` (10001)
- `statusText`: The error message
- `body`: JSON-serialized error details

### Error Body Serialization

The error details are serialized as JSON in the response body, making it easy to access structured error information:

- **String errors**: Serialized as `{ message: "error string" }`
- **Error objects**: All properties (including `message`, `stack`, and custom properties) are extracted and serialized

**Example with Error object:**

```javascript
import { safeFetch, ERROR_STATUS } from "@humanwhocodes/safe-fetch";

const response = await safeFetch("https://invalid-domain.example");

if (response.status === ERROR_STATUS) {
	const error = await response.json();
	console.log(error.message); // "Failed to fetch"
	console.log(error.stack);   // Stack trace
}
```

**Example with custom error properties:**

```javascript
const mockFetch = async () => {
	const error = new Error("Database connection failed");
	error.code = "DB_CONN_ERROR";
	error.retryAfter = 5000;
	throw error;
};

const safeMockFetch = createSafeFetch(mockFetch);
const response = await safeMockFetch("https://api.example.com/data");

if (response.status === ERROR_STATUS) {
	const error = await response.json();
	console.log(error.message);    // "Database connection failed"
	console.log(error.code);       // "DB_CONN_ERROR"
	console.log(error.retryAfter); // 5000
}
```

**Safety features:**

- Circular references are handled gracefully with a fallback to a simple message format
- Non-serializable properties (functions, symbols) are automatically filtered out
- Property access errors are caught and handled

## License

Copyright 2025 Nicholas C. Zakas

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
