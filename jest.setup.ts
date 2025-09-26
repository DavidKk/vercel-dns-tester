// Setup file for Jest to polyfill AsyncLocalStorage if needed
import { AsyncLocalStorage } from 'async_hooks'

// Make sure AsyncLocalStorage is available globally
global.AsyncLocalStorage = AsyncLocalStorage
