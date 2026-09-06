import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { readYaml, validate } from "./yaml";

function tmp(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aba-shared-"));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

describe("readYaml", () => {
  it("parses a document", () => {
    const f = tmp("a.yml", "foo: 1\nbar: [a, b]\n");
    expect(readYaml(f)).toEqual({ foo: 1, bar: ["a", "b"] });
  });
  it("throws with the path when missing", () => {
    expect(() => readYaml("/no/such/file.yml")).toThrow(/file not found/);
  });
});

describe("validate", () => {
  const schema = tmp(
    "s.json",
    JSON.stringify({
      type: "object",
      required: ["kind"],
      properties: { kind: { const: "X" } },
      additionalProperties: false,
    }),
  );

  it("returns data when valid", () => {
    expect(validate({ kind: "X" }, schema, "doc")).toEqual({ kind: "X" });
  });
  it("throws a labelled multi-line error when invalid", () => {
    expect(() => validate({ kind: "Y", extra: 1 }, schema, "doc")).toThrow(
      /doc failed schema validation/,
    );
  });
});
