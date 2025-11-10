# Copilot Instructions

This project is a Node.js library .

## Project Structure

- `src` - Contains all source code
- `tests` - Comprehensive test suite using Mocha

## Code Style and Patterns

### Error Handling

- Use specific error messages: "Expected an array argument.", "Expected at least one entry."
- Throw `TypeError` for type validation, `Error` for business logic
- Always validate inputs at method entry points

## Dependencies and Tools

- Node.js with ES modules
- Mocha for testing
- ESLint for linting
- Prettier for formatting
- JSDoc for type annotations
- TypeScript for type checking

## Testing Requirements

- All new methods need comprehensive tests
- Test both success and error paths
- Verify exact error messages
- Test async behavior and concurrent operations
- Mock external dependencies appropriately
- Run `npx mocha <filename>` to execute tests for specific files; always do this until all tests pass for this file.
- Run `npm test` to run all tests
- Do not change the working directory when running tests
