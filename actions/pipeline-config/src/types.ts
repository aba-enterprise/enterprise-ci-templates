// Shapes of the three input documents. Kept deliberately loose — the JSON
// Schemas in policy/schema/ are the source of truth for validation; these
// types just make the resolver code readable.

export type Gate = "block" | "warn";

export interface AppConfig {
  metadata?: {
    name?: string;
    language?: string;
    languageVersion?: string;
    type?: string;
  };
  ci?: { runner?: { backend?: string; labels?: string; os?: string } };
  build?: {
    workingDirectory?: string;
    buildCommand?: string;
    artifactPath?: string;
    projectPath?: string;
    dockerfilePath?: string;
  };
  test?: { command?: string; testProjectPath?: string; coverageReport?: string };
  quality?: { lint?: string };
  scan?: {
    codeQuality?: { projectKey?: string; organizationKey?: string };
    sast?: { profile?: string };
    image?: { repository?: string };
  };
}

export interface StageGate {
  required?: boolean;
  tool?: string;
  gate?: Gate;
  reusableWorkflow?: string;
  event?: string;
  appliesWhen?: { dockerfilePresent?: boolean };
  with?: Record<string, unknown>;
}

export interface PipelinePolicy {
  apiVersion: string;
  kind: "PipelinePolicy";
  test: {
    required: boolean;
    gate: Gate;
    coverage: { enforce: boolean; minPercent: number; gate: Gate };
  };
  codeQuality: StageGate;
  sast: StageGate;
  imageScan: StageGate;
  dependencyScan: StageGate;
  secretScan: StageGate;
  sast_codeql?: StageGate;
  exceptions: Record<string, unknown>;
}

export interface EnvBlock {
  vault: { addr: string; role: string };
  artifactory: {
    url: string;
    dockerRepo: string;
    mavenRepo: string;
    npmRepo: string;
  };
  prisma: { consoleUrl: string; collection: string };
}

export interface PipelineDefaults {
  apiVersion: string;
  kind: "PipelineDefaults";
  common: {
    registry: { host: string; namespace: string };
    runner: { backend: string; labels: string; os: string };
    build: {
      jobTimeoutMinutes: number;
      windowsJobTimeoutMinutes: number;
      artifactRetentionDays: number;
    };
    sonarqube: { url: string; qualityGate: string };
    veracode: { apiBase: string; policy: string };
  };
  environments: Record<string, EnvBlock>;
}

// The flat set of outputs this action emits (snake_case, matching action.yml).
export type Outputs = Record<string, string>;
