import assert from "node:assert/strict";
import { test } from "node:test";
import { BoundedTtlCache, RequestDeduplicator } from "../src/source/cache.js";

test("BoundedTtlCache returns a value until it expires", async () => {
  const cache = new BoundedTtlCache<string>({ ttlMs: 20, maxEntries: 10 });
  cache.set("a", "1");
  assert.equal(cache.get("a"), "1");
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(cache.get("a"), undefined);
});

test("BoundedTtlCache.getStale returns the last value even after expiry", async () => {
  const cache = new BoundedTtlCache<string>({ ttlMs: 10, maxEntries: 10 });
  cache.set("a", "1");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(cache.get("a"), undefined);
  assert.equal(cache.getStale("a"), "1");
});

test("BoundedTtlCache evicts the oldest entry once maxEntries is exceeded", () => {
  const cache = new BoundedTtlCache<string>({ ttlMs: 10_000, maxEntries: 2 });
  cache.set("a", "1");
  cache.set("b", "2");
  cache.set("c", "3");
  assert.equal(cache.size, 2);
  assert.equal(cache.get("a"), undefined);
  assert.equal(cache.get("b"), "2");
  assert.equal(cache.get("c"), "3");
});

test("RequestDeduplicator runs concurrent calls for the same key only once", async () => {
  const dedup = new RequestDeduplicator<number>();
  let callCount = 0;
  const run = () =>
    dedup.run("key", async () => {
      callCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return callCount;
    });

  const [a, b] = await Promise.all([run(), run()]);
  assert.equal(a, b);
  assert.equal(callCount, 1);
});

test("RequestDeduplicator allows a fresh call once the previous one settles", async () => {
  const dedup = new RequestDeduplicator<number>();
  let callCount = 0;
  const run = () => dedup.run("key", async () => ++callCount);

  await run();
  await run();
  assert.equal(callCount, 2);
});
