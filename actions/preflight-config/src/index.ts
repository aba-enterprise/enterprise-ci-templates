import * as path from "path";
import * as core from "@actions/core";
import {
  bundledPolicyDir,
  readYaml,
  resolveInWorkspace,
  validate,
} from "./load";
import { resolve } from "./resolve";
import type { AppConfig, PipelineDefaults, PipelinePolicy } from "./types";

async function run(): Promise<void> {
  try {
    const configPath = resolveInWorkspace(
      core.getInput("config-path") || "ci-config/config.yml",
    );
    const environment = core.getInput("environment") || "nonprod";

    const policyDir = bundledPolicyDir();
    const policyPath =
      core.getInput("policy-path") ||
      path.join(policyDir, "pipeline-policy.yml");
    const defaultsPath =
      core.getInput("defaults-path") ||
      path.join(policyDir, "pipeline-defaults.yml");
    const schemaDir = path.join(policyDir, "schema");

    core.info(`config   : ${configPath}`);
    core.info(`policy   : ${policyPath}`);
    core.info(`defaults : ${defaultsPath}`);
    core.info(`environment: ${environment}`);

    const config = validate<AppConfig>(
      readYaml(configPath),
      path.join(schemaDir, "config.schema.json"),
      "ci-config/config.yml",
    );
    const policy = validate<PipelinePolicy>(
      readYaml(policyPath),
      path.join(schemaDir, "pipeline-policy.schema.json"),
      "pipeline-policy.yml",
    );
    const defaults = validate<PipelineDefaults>(
      readYaml(defaultsPath),
      path.join(schemaDir, "pipeline-defaults.schema.json"),
      "pipeline-defaults.yml",
    );

    const outputs = resolve({ config, policy, defaults, environment });

    for (const [key, value] of Object.entries(outputs)) {
      core.setOutput(key, value);
    }

    core.info(
      `Resolved '${outputs.language}' | env=${environment} ` +
        `backend=${outputs.runner_backend} os=${outputs.runner_os}`,
    );
    await core.summary
      .addHeading("Preflight config", 3)
      .addTable([
        [
          { data: "Key", header: true },
          { data: "Value", header: true },
        ],
        ["environment", environment],
        ["language", outputs.language ?? ""],
        ["coverage floor", `${outputs.coverage_min ?? ""}%`],
        ["image scan", outputs.run_prisma ?? ""],
        ["vault", outputs.vault_addr ?? ""],
      ])
      .write();
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

void run();
