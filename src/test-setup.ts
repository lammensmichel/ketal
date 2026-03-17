/**
 * Test setup file - runs before all tests
 * This file sets up global mocks needed for testing
 */

// Mock global bootstrap object for tests (used by ToastComponent and other Bootstrap components)
(window as any).bootstrap = {
  Toast: class MockToast {
    constructor(_element: any, _options?: any) {}
    show() {}
    hide() {}
    dispose() {}
  },
  Modal: class MockModal {
    constructor(_element: any, _options?: any) {}
    show() {}
    hide() {}
    dispose() {}
  },
  Collapse: class MockCollapse {
    constructor(_element: any, _options?: any) {}
    show() {}
    hide() {}
    toggle() {}
    dispose() {}
  },
  Dropdown: class MockDropdown {
    constructor(_element: any, _options?: any) {}
    show() {}
    hide() {}
    toggle() {}
    dispose() {}
  },
};

// Also set on globalThis for broader compatibility
(globalThis as any).bootstrap = (window as any).bootstrap;
