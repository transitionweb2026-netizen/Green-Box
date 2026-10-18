import type { Json } from "@/types/database";

type JsonObject = { [key: string]: Json | undefined };

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-merges `override` onto `base` (used to layer admin-entered
 * translation overrides on top of the real messages/*.json at request
 * time -- see i18n/request.ts). Recurses into plain objects only; any
 * other value (string, array, etc.) in `override` replaces the
 * corresponding value in `base` wholesale, it never partially merges a
 * string or splices an array. `base` is never mutated.
 */
export function deepMerge<T extends JsonObject>(base: T, override: JsonObject): T {
  const result: JsonObject = { ...base };
  for (const key of Object.keys(override)) {
    const overrideValue = override[key];
    const baseValue = result[key];
    if (isPlainObject(overrideValue) && isPlainObject(baseValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }
  return result as T;
}

/** Reads the value at a dot-separated path (e.g. "home.heroHeadline"), or undefined if any segment is missing. */
export function getDeepValue(obj: JsonObject, path: string): Json | undefined {
  const segments = path.split(".");
  let current: Json | undefined = obj;
  for (const segment of segments) {
    if (!isPlainObject(current)) return undefined;
    current = current[segment];
  }
  return current;
}

/**
 * Returns a NEW object with `value` set at the given dot-separated path,
 * creating intermediate objects as needed. Does not mutate `obj`.
 */
export function setDeepValue(obj: JsonObject, path: string, value: Json): JsonObject {
  const segments = path.split(".");
  const [head, ...rest] = segments;
  if (rest.length === 0) {
    return { ...obj, [head]: value };
  }
  const child = isPlainObject(obj[head]) ? obj[head] : {};
  return { ...obj, [head]: setDeepValue(child, rest.join("."), value) };
}

/**
 * Returns a NEW object with the value at the given dot-separated path
 * removed, pruning any now-empty parent objects along the way -- keeps
 * the stored override blob sparse (only genuinely-overridden keys
 * present) rather than accumulating empty `{}` shells from past edits.
 */
function omitKey(obj: JsonObject, key: string): JsonObject {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));
}

export function deleteDeepValue(obj: JsonObject, path: string): JsonObject {
  const segments = path.split(".");
  const [head, ...rest] = segments;
  if (rest.length === 0) {
    return omitKey(obj, head);
  }
  const child = obj[head];
  if (!isPlainObject(child)) return obj;
  const prunedChild = deleteDeepValue(child, rest.join("."));
  if (Object.keys(prunedChild).length === 0) {
    return omitKey(obj, head);
  }
  return { ...obj, [head]: prunedChild };
}
