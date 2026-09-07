// Shapes of the two input documents. The JSON Schemas in policy/schema/ are the
// source of truth for validation; these types just make the resolver readable.

export type Target = "ecs" | "ec2" | "lambda" | "s3";
export type Strategy = "rolling" | "blue-green" | "canary";
export type EnvName = "dev" | "uat" | "prod";

export interface DeployConfig {
  apiVersion?: string;
  service?: { name?: string; target?: Target };
  environment?: { name?: EnvName; region?: string };
  release?: { version?: string; strategy?: Strategy };
  runtime?: {
    desiredCount?: number;
    cpu?: number;
    memory?: number;
    containerPort?: number;
    timeoutSeconds?: number;
    env?: Record<string, string>;
    secrets?: string[];
  };
  scaling?: { min?: number; max?: number; targetCpu?: number };
  healthcheck?: { path?: string; gracePeriodSeconds?: number };
  s3?: { sourceDir?: string; cacheControl?: string; invalidatePaths?: string[] };
}

export interface DeployEnvBlock {
  account: string;
  region: string;
  requireApproval: boolean;
  strategyDefault: Strategy;
  bakeMinutes?: number;
}

export interface DeployDefaults {
  apiVersion: string;
  kind: "DeployDefaults";
  common: {
    ssmPrefixPattern: string;
    deployRolePattern: string;
    sessionName: string;
  };
  environments: Record<string, DeployEnvBlock>;
}

// Flat snake_case outputs, matching action.yml.
export type Outputs = Record<string, string>;
