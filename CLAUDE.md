# Flare Codebase Guidelines

## Build Commands
- Build all packages: `npm run build`
- Build runtime: `npm run build --workspace=packages/runtime`
- Build WebAssembly: `npm run build:wasm --workspace=packages/runtime`
- Build TypeScript: `npm run build:ts --workspace=packages/runtime`
- Development server: `npm run dev`

## Test Commands
- Run all tests: `npm run test`
- Run specific test: `npm test -- -t "test name"`
- Run tests for package: `npm test --workspace=packages/runtime`

## Code Style
- TypeScript with strict type checking
- Target: ES2020, Module: ESNext
- Path aliases: Use `@flare/*` for package imports
- File organization: One component/class per file
- Use WebAssembly for performance-critical components
- Maintain separation between runtime, file-format, and shared packages

## Naming Conventions
- PascalCase for classes and types
- camelCase for variables, functions, and methods
- Use descriptive names for animation and rendering components
- Prefix private class members with underscore

## Error Handling
- Use explicit error types and descriptive messages
- Implement graceful degradation for runtime errors
- Log performance issues without breaking execution
- Validate inputs for rendering and animation functions