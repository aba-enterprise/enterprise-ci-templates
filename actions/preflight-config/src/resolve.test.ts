import { gateBlocks, resolve, stageRequired } from "./resolve";
import type { AppConfig, PipelineDefaults, PipelinePolicy } from "./types";

const policy: PipelinePolicy = {
  apiVersion: "pipeline.aba-enterprise/v1",
  kind: "PipelinePolicy",
  test: {
    required: true,
    gate: "block",
    coverage: { enforce: true, minPercent: 80, gate: "block" },
  },
  codeQuality: { required: true, tool: "sonarqube", gate: "block" },
  sast: { required: true, tool: "veracode", gate: "block" },
  imageScan: { required: true, tool: "prisma", gate: "block" },
  dependencyScan: { required: true, tool: "github-dependency-review", gate: "block" },
  secretScan: { required: true, tool: "gitleaks", gate: "block" },
  sast_codeql: { required: false, tool: "codeql", gate: "warn" },
  exceptions: {},
};

const defaults: PipelineDefaults = {
  apiVersion: "pipeline.aba-enterprise/v1",
  kind: "PipelineDefaults",
  common: {
    registry: { host: "ghcr.io", namespace: "aba-enterprise" },
    runner: { backend: "codebuild", labels: "self-hosted", os: "linux" },
    build: {
      jobTimeoutMinutes: 20,
      windowsJobTimeoutMinutes: 30,
      artifactRetentionDays: 7,
    },
    sonarqube: { url: "https://sonar.internal", qualityGate: "Enterprise Default" },
    veracode: { apiBase: "https://api.veracode.com", policy: "Enterprise Default" },
  },
  environments: {
    nonprod: {
      vault: { addr: "https://vault.nonprod:8200", role: "ci-nonprod" },
      artifactory: {
        url: "https://artifactory/artifactory",
        dockerRepo: "docker-nonprod",
        mavenRepo: "libs-snapshot",
        npmRepo: "npm-nonprod",
      },
      prisma: { consoleUrl: "https://prisma.internal", collection: "nonprod" },
    },
    prod: {
      vault: { addr: "https://vault.prod:8200", role: "ci-prod" },
      artifactory: {
        url: "https://artifactory/artifactory",
        dockerRepo: "docker-prod",
        mavenRepo: "libs-release",
        npmRepo: "npm-prod",
      },
      prisma: { consoleUrl: "https://prisma.internal", collection: "prod" },
    },
  },
};

const dotnetConfig: AppConfig = {
  metadata: { name: "widget-api", language: "dotnet", languageVersion: "8.0", type: "service" },
  build: { dockerfilePath: "Dockerfile", buildCommand: "dotnet build" },
  test: { command: "dotnet test" },
};

describe("gateBlocks", () => {
  it("blocks by default", () => expect(gateBlocks(undefined)).toBe("yes"));
  it("blocks on gate:block", () => expect(gateBlocks({ gate: "block" })).toBe("yes"));
  it("does not block on gate:warn", () => expect(gateBlocks({ gate: "warn" })).toBe("no"));
});

describe("stageRequired", () => {
  it("required unless explicitly false", () => {
    expect(stageRequired(undefined)).toBe("true");
    expect(stageRequired({ required: true })).toBe("true");
    expect(stageRequired({ required: false })).toBe("false");
  });
});

describe("resolve", () => {
  it("maps dotnet defaults and nonprod endpoints", () => {
    const out = resolve({ config: dotnetConfig, policy, defaults, environment: "nonprod" });
    expect(out.restore_cmd).toBe("dotnet restore");
    expect(out.codeql_lang).toBe("csharp");
    expect(out.coverage_min).toBe("80");
    expect(out.run_prisma).toBe("true"); // dockerfile present + required
    expect(out.run_codeql).toBe("false"); // sast_codeql.required === false
    expect(out.vault_addr).toBe("https://vault.nonprod:8200");
    expect(out.artifactory_maven_repo).toBe("libs-snapshot");
    expect(out.job_timeout).toBe("20");
  });

  it("selects prod endpoints", () => {
    const out = resolve({ config: dotnetConfig, policy, defaults, environment: "prod" });
    expect(out.vault_role).toBe("ci-prod");
    expect(out.artifactory_maven_repo).toBe("libs-release");
    expect(out.prisma_collection).toBe("prod");
  });

  it("skips image scan when no dockerfile", () => {
    const out = resolve({
      config: { ...dotnetConfig, build: { buildCommand: "dotnet build" } },
      policy,
      defaults,
      environment: "nonprod",
    });
    expect(out.run_prisma).toBe("false");
  });

  it("uses windows timeout for windows runner", () => {
    const out = resolve({
      config: { ...dotnetConfig, ci: { runner: { os: "windows" } } },
      policy,
      defaults,
      environment: "nonprod",
    });
    expect(out.job_timeout).toBe("30");
  });

  it("throws on an unknown environment", () => {
    expect(() =>
      resolve({ config: dotnetConfig, policy, defaults, environment: "staging" }),
    ).toThrow(/environment 'staging' not defined/);
  });

  it("falls back image_repository to metadata.name", () => {
    const out = resolve({ config: dotnetConfig, policy, defaults, environment: "nonprod" });
    expect(out.image_repository).toBe("widget-api");
  });
});
