# DevOps Bootstrap Guide

## Quick Start

**One command to set up DevOps standards in your project:**

```bash
./bootstrap.sh
```

## What It Does

Automatically installs organizational DevOps standards:
- ✅ **Git Hooks** - Code quality validation, Jira commit format
- ✅ **CI/CD Workflows** - GitHub Actions templates for CI and CD
- ✅ **PR Templates** - Standardized pull request format
- ✅ **CODEOWNERS** - Code ownership and review assignments
- ✅ **Scan Scripts** - SonarQube local analysis tools
- ✅ **ECS Manifests** - ECS deployment templates

## Usage

### 1. Get Bootstrap
```bash
git clone --depth 1 --no-checkout https://clicktime.symantec.com/15xX7FFXi5zgBt5HxzYYS?h=5Jda9MPUT50irx5weVmm8qLu9e0XJsMEnoRX4fs6D1A=&u=https://github.com/CRBG-PhoenixPOC/central-devops-config.git temp_bootstrap && cd temp_bootstrap && git checkout HEAD -- bootstrap.sh && cp bootstrap.sh ../bootstrap.sh && cd .. && rm -rf temp_bootstrap
```

### 2. Run Setup
```bash
./bootstrap.sh
```

### 3. Commit Changes
```bash
git commit -m "feat: add DevOps standards"
```

## What Gets Installed

| Component | Files | Purpose |
|-----------|-------|---------|
| **Git Hooks** | `pre-commit`, `commit-msg`, `pre-push` | Code validation, Jira format |
| **CI Workflows** | `ci-dev-template.yml` | Continuous Integration pipeline |
| **CD Workflows** | `cd-uat-prod-template.yml` | Deployment to UAT/Production |
| **PR Template** | `pull_request_template.md` | Standardized pull requests |
| **CODEOWNERS** | `CODEOWNERS` | Code ownership rules |
| **Scans** | `sonar-analysis-generic.sh` | Code quality analysis |
| **ECS Manifests** | `ecs-manifest.yml` | ECS deployment |

## Verification

```bash
# Check hooks are configured
git config --get core.hooksPath

# Test commit validation  
git commit -m "feat: PROJ-123 test message"

# Run code scan
./localscans/sonarscan.sh

# Check installed components
ls -la .githooks/          # Git hooks
ls -la .github/workflows/  # CI/CD workflows  
ls -la .github/            # PR template & CODEOWNERS
ls -la localscans/         # Scan scripts
ls -la manifest/           # ECS manifests
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not in git repository" | Run from project root: `cd your-project && ./bootstrap.sh` |
| "Failed to access DevOps repo" | Check network: `ping github.com` |
| Hooks not working | Verify config: `git config --get core.hooksPath` |
| Files not staged | Manual stage: `git add .githooks/ .github/ localscans/ manifest/` |

## Smart Updates

**First Run:** Installs all DevOps components
```bash
✅ Installed: 3 hooks, 3 workflows & templates, 1 scan scripts, 1 manifests
```

**Subsequent Runs:** Smart behavior per component type
- **Git Hooks** 🔄 Always update (policies may change)
- **Workflows** ℹ️ Skip if customized (respects team changes)
- **PR Template** ℹ️ Skip if exists (preserves customizations)  
- **CODEOWNERS** ℹ️ Skip if exists (preserves team ownership rules)
- **Manifests** ℹ️ Skip if exists (preserves project-specific configs)

**Get latest standards:** Re-run `./bootstrap.sh` anytime - safe and idempotent!

## Complete DevOps Toolchain

After installation, your project has:
- 🔒 **Code Quality Gates** via git hooks
- 🚀 **CI/CD Pipelines** for automated testing and deployment
- 📋 **Standardized PRs** with consistent templates
- � **Code Ownership** with CODEOWNERS file
- ☸️ **ECS Deployment** with manifest templates
- 🔍 **Code Scanning** with SonarQube integration
