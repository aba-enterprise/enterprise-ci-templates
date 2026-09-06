import * as fs from "fs";
import { parse as parseYaml } from "yaml";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";

// Schemas in policy/schema/ declare draft 2020-12.
const ajv = new Ajv2020({ allErrors: true, strict: false });

/** Read and parse a YAML file. Throws with the path if it is missing. */
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
  const check: ValidateFunction = ajv.compile(schema);
  if (!check(data)) {
    const detail = (check.errors ?? [])
      .map((e) => `  ${e.instancePath || "/"} ${e.message}`)
      .join("\n");
    throw new Error(`${label} failed schema validation:\n${detail}`);
  }
  return data as T;
}
