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

// the ERROR_STATUS indicates it's a caught error
if (response.status === ERROR_STATUS) {
	console.error("Error:", response.statusText);
	// "This operation was aborted"
} else {
	const data = await response.json();
	console.log(data);
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

if (response.status === ERROR_STATUS) {
	console.error("Error:", response.statusText);
} else {
	console.log("Success!");
}
```

### `ERROR_STATUS`

A constant representing the status code used for caught errors. This eliminates the need to use magic numbers in your code:

```javascript
import { safeFetch, ERROR_STATUS } from "@humanwhocodes/safe-fetch";

const response = await safeFetch("https://api.example.com/data");

if (response.status === ERROR_STATUS) {
	console.error("Error:", response.statusText);
}
```

The value of `ERROR_STATUS` is `10001`.

## How It Works

The `Response` constructor in JavaScript only accepts status codes in the range 200-599. To work around this limitation, `safe-fetch` creates a `Response` object with status 599 and then uses `Object.defineProperty()` to override the status property with `ERROR_STATUS` (10001).

When a fetch operation fails (network error, abort signal, etc.), instead of rejecting the promise, `safe-fetch` catches the error and returns a Response object with:

- `status`: `ERROR_STATUS` (10001)
- `statusText`: The error message

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
