import { test, expect } from "@playwright/experimental-ct-vue";
import { EventHandler, NestedEventCallbacks } from "./eventHandler";

test("should call the correct nested function with remaining event path", async () => {
  let wasCalled = false;
  const mockCallback = () => {
    wasCalled = true;
  };
  const nestedEventCallbacks: NestedEventCallbacks = {
    level1: {
      level2: {
        level3: mockCallback,
      },
    },
  };

  EventHandler.handleCustomEvent("level1.level2.level3", nestedEventCallbacks);

  expect(wasCalled).toBe(true);
});

test("should call the correct nested function with remaining event path items", async () => {
  let wasCalled = false;
  const mockCallback = () => {
    wasCalled = true;
  };
  const nestedEventCallbacks: NestedEventCallbacks = {
    level1: {
      level2: {
        level3: mockCallback,
      },
    },
  };

  EventHandler.handleCustomEvent(
    "level1.level2.level3.level4",
    nestedEventCallbacks,
  );

  expect(wasCalled).toBe(true);
});

test("should call the correct nested function in root callback definition", async () => {
  let wasCalled = false;
  const mockCallback = () => {
    wasCalled = true;
  };
  const nestedEventCallbacks: NestedEventCallbacks = {
    level1: mockCallback,
  };

  EventHandler.handleCustomEvent(
    "level1.level2.level3.level4",
    nestedEventCallbacks,
  );

  expect(wasCalled).toBe(true);
});

test("should throw an error if event path is not handled", async () => {
  const nestedEventCallbacks: NestedEventCallbacks = {
    level1: {
      level2: {},
    },
  };

  expect(() => {
    EventHandler.handleCustomEvent(
      "level1.level2.level3",
      nestedEventCallbacks,
    );
  }).toThrow("Unhandled event: level1.level2.level3");
});
