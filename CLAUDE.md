# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

T-State is a global state management library for React applications with TypeScript. It provides a reactive store system with hooks integration, built on top of Immer for immutable state updates and useSyncExternalStore for React integration.

## Package Management & Commands

This project uses `pnpm` as the package manager. Key commands:

- **Development & Testing:**
  - `pnpm test` - Run all tests with Vitest
  - `pnpm lint` - Run full lint pipeline (TypeScript check + ESLint + Prettier)
  - `pnpm tsc` - TypeScript type checking only
  - `pnpm eslint` - ESLint only
  - `pnpm format` - Prettier formatting

## Architecture

### Core Components

1. **Store Class (`src/main.ts`)** - The main state container with:

   - State management with lazy initialization support
   - Subscription system for state changes
   - Middleware support for intercepting state changes
   - Batching and debouncing capabilities
   - Integration with Redux DevTools in development

2. **React Hooks Integration (`src/hooks.tsx`)** - Additional hooks:

   - `useCreateStore` - Create stores within components
   - `useStoreSnapshot` - Conditional state snapshots
   - `useSelectFromStore` - External store selection

3. **Computed States (`src/computed.ts`)** - Derived state functionality that automatically updates when dependencies change

4. **Utilities:**
   - `src/deepEqual.ts` - Deep equality comparison
   - `src/shallowEqual.ts` - Shallow equality comparison
   - `src/subscribeUtils.ts` - Subscription utilities and `observeChanges`
   - `src/useSyncExternalStoreWithSelector.ts` - Custom implementation of React's external store hook

### Key Patterns

- **Immutability**: State is automatically deep frozen in development mode
- **Equality Checking**: Built-in shallow/deep equality functions prevent unnecessary re-renders
- **Middleware System**: Allows intercepting and modifying state changes
- **Lazy Initialization**: Stores can be initialized with functions for performance
- **Batching**: Multiple state updates can be batched together

## Testing

- **Framework**: Vitest with jsdom environment
- **Location**: All tests in `/test/` directory
- **Setup**: `test/setup.ts` configures test environment
- **Coverage**: Comprehensive tests for all major functionality including React hooks, store operations, computed states, and utilities

## Build System

- **Bundler**: tsup for dual CJS/ESM output
- **TypeScript**: Strict mode with comprehensive type checking
- **Target**: ES modules with CommonJS compatibility
- **Output**: `dist/` directory with `.js`, `.cjs`, and `.d.ts` files

## Development Guidelines

- Uses strict TypeScript configuration with `noUncheckedIndexedAccess`
- ESLint configuration from `@ls-stack/eslint-cfg` with some rules disabled for `any` types
- Prettier for code formatting
- All state mutations should go through store methods (never direct mutation)
- Test files should be in `/test/` directory with `.test.ts|tsx` extension
