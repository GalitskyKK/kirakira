import '@testing-library/jest-dom'

// Mock IntersectionObserver with proper typing
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = '0px'
  readonly thresholds: ReadonlyArray<number> = []

  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit
  ) {}

  observe(_target: Element): void {
    // Mock implementation
  }

  unobserve(_target: Element): void {
    // Mock implementation
  }

  disconnect(): void {
    // Mock implementation
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

// Define the global type properly
declare global {
  var IntersectionObserver: {
    new (
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit
    ): IntersectionObserver
    prototype: IntersectionObserver
  }
}

global.IntersectionObserver = MockIntersectionObserver

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => {
    return localStorage[key] || null
  },
  setItem: (key: string, value: string) => {
    localStorage[key] = value
  },
  removeItem: (key: string) => {
    delete localStorage[key]
  },
  clear: () => {
    Object.keys(localStorage).forEach(key => {
      delete localStorage[key]
    })
  },
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Suppress console warnings in tests
const originalWarn = console.warn

// Define proper test lifecycle functions with type safety
declare global {
  var beforeAll: ((fn: () => void | Promise<void>) => void) | undefined
  var afterAll: ((fn: () => void | Promise<void>) => void) | undefined
}

if (
  typeof globalThis !== 'undefined' &&
  'beforeAll' in globalThis &&
  globalThis.beforeAll
) {
  globalThis.beforeAll(() => {
    console.warn = (...args: unknown[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('ReactDOM.render is no longer supported')
      ) {
        return
      }
      originalWarn.call(console, ...args)
    }
  })
}

if (
  typeof globalThis !== 'undefined' &&
  'afterAll' in globalThis &&
  globalThis.afterAll
) {
  globalThis.afterAll(() => {
    console.warn = originalWarn
  })
}
