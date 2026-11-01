import teardown from "./teardown.js";

export function setup() {
  // Return the teardown callback to run when Vitest finishes testing
  return async () => {
    await teardown();
  };
}
