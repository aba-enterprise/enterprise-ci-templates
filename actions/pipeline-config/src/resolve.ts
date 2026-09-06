// Pure resolution logic — no filesystem, no @actions/core — so it is trivially
// unit-testable. index.ts does the I/O and hands parsed objects to resolve().

import type {
  AppConfig,
  EnvBlock,
  Outputs,
  PipelineDefaults,
  PipelinePolicy,
  StageGate,
} from "./types";

const RESTORE_BY_LANGUAGE: Record<string, string> = {
  node: "npm ci",
  dotnet: "dotnet restore",
  java: "mvn -B dependency:go-offline",
  python: "pip install -r requirements.txt",
  "dotnet-framework": "nuget restore",
};

const CODEQL_BY_LANGUAGE: Record<string, string> = {
  node: "javascript-typescript",
  dotnet: "csharp",
  java: "java-kotlin",
  python: "python",
};

/** A gate blocks unless the policy explicitly sets `gate: warn`. */
export function gateBlocks(node: { gate?: string } | undefined): "yes" | "no" {
  return node?.gate === "warn" ? "no" : "yes";
}

/** A stage runs unless the policy explicitly sets `required: false`. */
export function stageRequired(
  node: StageGate | undefined,
): "true" | "false" {
  return node?.required === false ? "false" : "true";
}

export interface ResolveArgs {
  config: AppConfig;
  policy: PipelinePolicy;
  defaults: PipelineDefaults;
  environment: string;
}

export function resolve({
  config,
  policy,
  defaults,
  environment,
}: ResolveArgs): Outputs {
  const env: EnvBlock | undefined = defaults.environments[environment];
  if (!env) {
    const known = Object.keys(defaults.environments).join(" | ");
    throw new Error(
      `environment '${environment}' not defined in pipeline-defaults.yml (expected ${known})`,
    );
  }

  const language = config.metadata?.language ?? "";
  const runnerOs = config.ci?.runner?.os ?? "linux";
  const dockerfile = config.build?.dockerfilePath ?? "";
  const imageRepo =
    config.scan?.image?.repository || config.metadata?.name || "";

  const runPrisma =
    dockerfile !== "" && stageRequired(policy.imageScan) === "true";

  const jobTimeout =
    runnerOs === "windows"
      ? defaults.common.build.windowsJobTimeoutMinutes
      : defaults.common.build.jobTimeoutMinutes;

  return {
    // --- app identity / build ---
    name: config.metadata?.name ?? "",
    language,
    language_version: config.metadata?.languageVersion ?? "",
    type: config.metadata?.type ?? "",
    runner_backend: config.ci?.runner?.backend ?? "codebuild",
    runner_labels: config.ci?.runner?.labels ?? "self-hosted",
    runner_os: runnerOs,
    working_dir: config.build?.workingDirectory ?? ".",
    restore_cmd: RESTORE_BY_LANGUAGE[language] ?? "",
    build_cmd: config.build?.buildCommand ?? "",
    test_cmd: config.test?.command ?? "",
    lint_cmd: config.quality?.lint ?? "",
    artifact_path: config.build?.artifactPath ?? "",
    project_path: config.build?.projectPath ?? "",
    test_project_path: config.test?.testProjectPath ?? "",
    coverage_report: config.test?.coverageReport ?? "",
    dockerfile_path: dockerfile,
    job_timeout: String(jobTimeout),

    // --- scan identifiers ---
    sonar_project_key: config.scan?.codeQuality?.projectKey ?? "",
    sonar_org_key: config.scan?.codeQuality?.organizationKey ?? "",
    sast_profile: config.scan?.sast?.profile ?? "",
    image_repository: imageRepo,
    codeql_lang: CODEQL_BY_LANGUAGE[language] ?? "",

    // --- gate decisions (policy, app-immutable) ---
    gate_test: gateBlocks(policy.test),
    gate_coverage: gateBlocks(policy.test?.coverage),
    coverage_min: String(policy.test?.coverage?.minPercent ?? ""),
    run_sonar: stageRequired(policy.codeQuality),
    run_sonar_gate: gateBlocks(policy.codeQuality),
    run_veracode: stageRequired(policy.sast),
    run_veracode_gate: gateBlocks(policy.sast),
    run_prisma: String(runPrisma),
    run_prisma_gate: gateBlocks(policy.imageScan),
    run_dependency: stageRequired(policy.dependencyScan),
    run_secret: stageRequired(policy.secretScan),
    run_codeql: stageRequired(policy.sast_codeql),

    // --- service endpoints (defaults) ---
    environment,
    registry_host: defaults.common.registry.host,
    registry_namespace: defaults.common.registry.namespace,
    sonarqube_url: defaults.common.sonarqube.url,
    sonarqube_quality_gate: defaults.common.sonarqube.qualityGate,
    veracode_api_base: defaults.common.veracode.apiBase,
    veracode_policy: defaults.common.veracode.policy,
    vault_addr: env.vault.addr,
    vault_role: env.vault.role,
    artifactory_url: env.artifactory.url,
    artifactory_docker_repo: env.artifactory.dockerRepo,
    artifactory_maven_repo: env.artifactory.mavenRepo,
    artifactory_npm_repo: env.artifactory.npmRepo,
    prisma_console_url: env.prisma.consoleUrl,
    prisma_collection: env.prisma.collection,
  };
}
