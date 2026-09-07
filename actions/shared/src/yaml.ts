import * as fs from "fs";
import { load as parseYaml } from "js-yaml";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";

/**
 * Read and parse a YAML file. Throws with the path if it is missing.
 *
 * js-yaml follows YAML 1.1, so unquoted `yes/no/on/off` parse as booleans and
 * unquoted `1.0` as a number. The JSON Schemas in policy/schema/ pin every
 * scalar to a string/enum, so a mistyped value fails validation loudly rather
 * than resolving to the wrong type silently.
 */
export function readYaml<T>(file: string): T {
  if (!fs.existsSync(file)) {
    throw new Error(`file not found: ${file}`);
  }
  return parseYaml(fs.readFileSync(file, "utf8")) as T;
}

/**
 * Validate `data` against the JSON Schema at `schemaFile`.
 * Returns `data` typed as T on success; throws a readable multi-line error otherwise.
 */
export function validate<T>(
  data: unknown,
  schemaFile: string,
  label: string,
): T {
  const schema = JSON.parse(fs.readFileSync(schemaFile, "utf8"));
  // Fresh instance per call: Ajv refuses to re-register a schema $id, and each
  // document type is validated against its own schema exactly once anyway.
  // Schemas in policy/schema/ declare draft 2020-12.
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const check: ValidateFunction = ajv.compile(schema);
  if (!check(data)) {
    const detail = (check.errors ?? [])
      .map((e) => `  ${e.instancePath || "/"} ${e.message}`)
      .join("\n");
    throw new Error(`${label} failed schema validation:\n${detail}`);
  }
  return data as T;
}
