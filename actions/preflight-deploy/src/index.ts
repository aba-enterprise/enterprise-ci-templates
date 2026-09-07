import * as path from "path";
import * as core from "@actions/core";
import {
  bundledPolicyDir,
  readYaml,
  resolveInWorkspace,
  validate,
} from "./load";
import { resolve } from "./resolve";
import type { DeployConfig, DeployDefaults } from "./types";

async function run(): Promise<void> {
  try {
    const configDir = core.getInput("config-path") || "deploy";
    const environment = core.getInput("environment", { required: true });
    const versionOverride = core.getInput("version");
    const validateOnly = core.getBooleanInput("validate-only");

    const configPath = resolveInWorkspace(
      path.join(configDir, `${environment}.yml`),
    );

    const policyDir = bundledPolicyDir();
    const defaultsPath =
      core.getInput("defaults-path") ||
      path.join(policyDir, "deploy-defaults.yml");
    const schemaDir = path.join(policyDir, "schema");

    core.info(`config   : ${configPath}`);
    core.info(`defaults : ${defaultsPath}`);

    const config = validate<DeployConfig>(
      readYaml(configPath),
      path.join(schemaDir, "deploy-config.schema.json"),
      `deploy/${environment}.yml`,
    );
    const defaults = validate<DeployDefaults>(
      readYaml(defaultsPath),
      path.join(schemaDir, "deploy-defaults.schema.json"),
      "deploy-defaults.yml",
    );

    if (config.environment?.name && config.environment.name !== environment) {
      throw new Error(
        `environment mismatch: workflow asked for '${environment}' but deploy/${environment}.yml declares '${config.environment.name}'`,
      );
    }

    if (validateOnly) {
      // Schema + cross-field checks only. Do NOT run resolve() — it enforces
      // "version required unless dev", which a PR check can't satisfy for uat/prod.
      core.info(`✓ deploy/${environment}.yml is valid (${config.service?.name} → ${config.service?.target})`);
      await core.summary
        .addHeading("Preflight deploy — validate only", 3)
        .addRaw(`\`deploy/${environment}.yml\` is valid.`)
        .write();
      return;
    }

    const outputs = resolve({ config, defaults, versionOverride });

    for (const [key, value] of Object.entries(outputs)) {
      core.setOutput(key, value);
    }

    const show = (k: string): string => outputs[k] ?? "";
    core.info(
      `Resolved ${show("service_name")} → ${show("target")} @ ${show("environment")} ` +
        `(${show("region")}) version=${show("version") || "latest"} strategy=${show("strategy")}`,
    );
    await core.summary
      .addHeading("Preflight deploy", 3)
      .addTable([
        [
          { data: "Key", header: true },
          { data: "Value", header: true },
        ],
        ["service", show("service_name")],
        ["target", show("target")],
        ["environment", show("environment")],
        ["region", show("region")],
        ["version", show("version") || "latest"],
        ["strategy", show("strategy")],
        ["deploy role", show("deploy_role")],
      ])
      .write();
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

void run();
