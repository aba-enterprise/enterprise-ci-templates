// Pure resolution logic — no filesystem, no @actions/core — so it is trivially
// unit-testable. index.ts does the I/O and hands parsed objects to resolve().

import type { DeployConfig, DeployDefaults, DeployEnvBlock, Outputs } from "./types";

export interface ResolveArgs {
  config: DeployConfig;
  defaults: DeployDefaults;
  /** `version` workflow input — wins over release.version in the file. */
  versionOverride?: string;
}

function fill(pattern: string, vars: Record<string, string>): string {
  return pattern.replace(/\{(\w+)\}/g, (_m, k: string) => {
    const v = vars[k];
    if (v === undefined) throw new Error(`unknown placeholder {${k}} in "${pattern}"`);
    return v;
  });
}

export function resolve({ config, defaults, versionOverride }: ResolveArgs): Outputs {
  const envName = config.environment?.name ?? "";
  const env: DeployEnvBlock | undefined = defaults.environments[envName];
  if (!env) {
    const known = Object.keys(defaults.environments).join(" | ");
    throw new Error(
      `environment '${envName}' not defined in deploy-defaults.yml (expected ${known})`,
    );
  }

  const service = config.service?.name ?? "";
  const target = config.service?.target ?? "";

  const version = (versionOverride || config.release?.version || "").trim();
  if (!version && envName !== "dev") {
    throw new Error(
      `release.version is required for environment '${envName}' — only 'dev' may deploy the latest artifact`,
    );
  }

  const region = config.environment?.region || env.region;
  const strategy = config.release?.strategy || env.strategyDefault;

  const deployRole = fill(defaults.common.deployRolePattern, {
    account: env.account,
    service,
    env: envName,
  });

  const rt = config.runtime ?? {};
  const sc = config.scaling ?? {};
  const hc = config.healthcheck ?? {};
  const s3 = config.s3 ?? {};

  const num = (n: number | undefined): string => (n === undefined ? "" : String(n));

  return {
    // identity / routing
    service_name: service,
    target,
    environment: envName,
    region,
    account_id: env.account,
    deploy_role: deployRole,
    session_name: defaults.common.sessionName,

    // release
    version,
    strategy,
    require_approval: String(env.requireApproval),
    bake_minutes: String(env.bakeMinutes ?? 0),

    // runtime (ecs / ec2 / lambda)
    desired_count: num(rt.desiredCount),
    cpu: num(rt.cpu),
    memory: num(rt.memory),
    container_port: num(rt.containerPort),
    timeout_seconds: num(rt.timeoutSeconds),
    runtime_env_json: JSON.stringify(rt.env ?? {}),
    secret_names: (rt.secrets ?? []).join(","),

    // scaling / health (ecs / ec2)
    scale_min: num(sc.min),
    scale_max: num(sc.max),
    scale_target_cpu: num(sc.targetCpu),
    health_path: hc.path ?? "",
    health_grace_seconds: num(hc.gracePeriodSeconds),

    // static site (s3)
    s3_source_dir: s3.sourceDir ?? "",
    s3_cache_control: s3.cacheControl ?? "",
    s3_invalidate_paths: (s3.invalidatePaths ?? ["/*"]).join(","),
  };
}
