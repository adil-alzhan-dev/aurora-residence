import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const config = readFileSync(
  fileURLToPath(new URL("../../../nginx/default.conf", import.meta.url)),
  "utf8",
);

function locationBlock(path: string): string {
  const start = config.indexOf(`location ${path} {`);
  if (start === -1) throw new Error(`location ${path} not found`);
  return config.slice(start, config.indexOf("}", start));
}

describe("nginx security headers for the web app", () => {
  const block = locationBlock("/");

  it.each([
    ["Content-Security-Policy", `"frame-ancestors 'none'"`],
    ["X-Frame-Options", "DENY"],
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ])("sends %s on every response", (name, value) => {
    expect(block).toContain(`add_header ${name} ${value} always;`);
  });

  it("does not ship a full CSP that would block Next scripts", () => {
    expect(block).not.toMatch(/script-src|default-src/);
  });
});
