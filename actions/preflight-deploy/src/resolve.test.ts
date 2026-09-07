import { resolve } from "./resolve";
import type { DeployConfig, DeployDefaults } from "./types";

const defaults: DeployDefaults = {
  apiVersion: "pipeline.aba-enterprise/v1",
  kind: "DeployDefaults",
  common: {
    deployRolePattern: "arn:aws:iam::{account}:role/gha-deploy-{service}",
    sessionName: "gha-deploy",
  },
  environments: {
    dev: { account: "111111111111", region: "us-east-1", requireApproval: false, strategyDefault: "rolling" },
    prod: { account: "333333333333", region: "us-east-1", requireApproval: true, strategyDefault: "blue-green", bakeMinutes: 10 },
  },
};

const base: DeployConfig = {
  apiVersion: "cd/v1",
  service: { name: "dotnet-sample-app", target: "ecs" },
  environment: { name: "dev" },
  release: { strategy: "rolling" },
  runtime: { desiredCount: 2, env: { ASPNETCORE_ENVIRONMENT: "Development" }, secrets: ["Db__Conn"] },
};

describe("resolve", () => {
  it("fills the OIDC role from the env block", () => {
    const out = resolve({ config: base, defaults });
    expect(out.deploy_role).toBe("arn:aws:iam::111111111111:role/gha-deploy-dotnet-sample-app");
    expect(out.account_id).toBe("111111111111");
    expect(out.runtime_env_json).toBe('{"ASPNETCORE_ENVIRONMENT":"Development"}');
    expect(out.secret_names).toBe("Db__Conn");
  });

  it("allows an empty version only for dev", () => {
    expect(resolve({ config: base, defaults }).version).toBe("");
    const prod: DeployConfig = { ...base, environment: { name: "prod" }, release: { strategy: "blue-green" } };
    expect(() => resolve({ config: prod, defaults })).toThrow(/release.version is required/);
    expect(resolve({ config: prod, defaults, versionOverride: "sha256:abc" }).version).toBe("sha256:abc");
  });

  it("defaults strategy and bake time from deploy-defaults when the file omits them", () => {
    const prod: DeployConfig = {
      ...base,
      environment: { name: "prod" },
      release: { version: "sha256:abc" } as DeployConfig["release"],
    };
    const out = resolve({ config: prod, defaults });
    expect(out.strategy).toBe("blue-green");
    expect(out.bake_minutes).toBe("10");
  });

  it("rejects an unknown environment", () => {
    const bad: DeployConfig = { ...base, environment: { name: "uat" } };
    expect(() => resolve({ config: bad, defaults })).toThrow(/not defined in deploy-defaults/);
  });
});
