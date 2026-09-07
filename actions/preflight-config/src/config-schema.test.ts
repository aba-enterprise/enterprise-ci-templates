import * as path from "path";
// Import the source (not the built lib/) so the test tracks current behaviour.
import { readYaml, validate } from "../../shared/src/yaml";
import type { AppConfig } from "./types";

// Validate against the real, shipped schema — the same file the action bundles.
const SCHEMA = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "policy",
  "schema",
  "config.schema.json",
);
const FIXTURE = path.resolve(
  __dirname,
  "..",
  "test",
  "fixtures",
  "config.dotnet.yml",
);

const good: AppConfig = {
  apiVersion: "ci/v2",
  metadata: { name: "widget-api", language: "dotnet" },
  test: { command: "dotnet test" },
};

function check(data: unknown): AppConfig {
  return validate<AppConfig>(data, SCHEMA, "ci-config/config.yml");
}

describe("config.schema.json", () => {
  it("accepts the CI smoke-test fixture", () => {
    expect(() => check(readYaml(FIXTURE))).not.toThrow();
  });

  it("accepts a minimal valid config", () => {
    expect(check(good)).toEqual(good);
  });

  it("rejects a missing apiVersion", () => {
    const { apiVersion: _omit, ...rest } = good;
    void _omit;
    expect(() => check(rest)).toThrow(/required property 'apiVersion'/);
  });

  it("rejects a malformed apiVersion", () => {
    expect(() => check({ ...good, apiVersion: "v2" })).toThrow(
      /schema validation/,
    );
  });

  it("rejects a missing test block", () => {
    expect(() => check({ metadata: good.metadata })).toThrow(
      /must have required property 'test'/,
    );
  });

  it("rejects an empty test.command", () => {
    expect(() => check({ ...good, test: { command: "" } })).toThrow(
      /schema validation/,
    );
  });

  it("rejects an unknown language", () => {
    expect(() =>
      check({ ...good, metadata: { name: "x", language: "rust" } }),
    ).toThrow(/allowed values/);
  });

  it("rejects a misspelled key (additionalProperties)", () => {
    expect(() =>
      check({ ...good, build: { dockerfilepath: "Dockerfile" } }),
    ).toThrow(/must NOT have additional properties/);
  });

  it("rejects a non-string dockerfilePath", () => {
    expect(() => check({ ...good, build: { dockerfilePath: 123 } })).toThrow(
      /schema validation/,
    );
  });
});
