# Central DevOps Process Documentation

## Table of Contents

1. [Overview](#overview)
2. [Repository Purpose and Structure](#repository-purpose-and-structure)
3. [Initial Setup Process](#initial-setup-process)
4. [Development Workflow](#development-workflow)
5. [CI/CD Pipeline Architecture](#cicd-pipeline-architecture)
6. [Security and Compliance](#security-and-compliance)
7. [Deployment Process](#deployment-process)
8. [Quality Assurance](#quality-assurance)
9. [Troubleshooting and Support](#troubleshooting-and-support)

---

## Overview

The Central DevOps Configuration repository serves as a centralized hub for standardized CI/CD pipelines, infrastructure configurations, and automation scripts. It provides reusable GitHub Actions workflows that ensure consistency across all application repositories.

### Key Objectives

- Standardize CI/CD practices across all projects
- Reduce duplication and maintenance overhead
- Accelerate onboarding of new applications
- Enforce security, compliance, and governance standards

### Supported Technologies

- **Languages**: Java, .NET/C#, Node.js, Python
- **Build Tools**: Maven, Gradle, dotnet CLI, npm, pip
- **Container Platform**: Docker with multi-architecture support
- **Cloud Platform**: AWS (ECS, ECR)
- **Security Scanning**: CodeQL (GHAS) , Prisma Cloud
- **Version Control**: GitHub with Git hooks
- **Testing Frameworks**: XUnit, JUnit
- **Code Coverage**: JaCoCo

---

## Repository Purpose and Structure

### Repository Architecture

```
central-devops-config/
├── .github/
│   └── workflows/              # Reusable GitHub Actions workflows
│       ├── ci-dev-template.yml
│       ├── cd-uat-prod-template.yml
│       ├── docker-build-template.yml
│       ├── docker-image-scan-template.yml
│       ├── codeql-template.yml
│       ├── repository-compliance-template.yml
│       ├── ecs-deployment-template.yml
│       ├── unit-testing-template.yml
│       └── main-pipeline-template.yml
├── .githooks/                  # Git hooks for validation
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── docker/
│   └── Dockerfile              # Standardized Dockerfile template
├── localscans/
│   ├── sonar-analysis-generic.sh
│   └── codeql.sh
├── manifest/
│   └── ecs-manifest.yml        # ECS deployment manifest
├── maven/
│   └── settings.xml            # Maven configuration
├── bootstrap.sh                # Automated setup script
├── bootstrap-githooks-setup.sh                
└── Documentation files

```

### Key Components

- **Workflow Templates**: Reusable GitHub Actions workflows that provide standardized CI/CD capabilities
- **Git Hooks**: Pre-commit, commit-msg, and pre-push hooks for code quality and policy enforcement
- **Docker Configuration**: Standardized Dockerfile supporting multiple languages and frameworks
- **Deployment Manifests**: ECS task definitions and service configurations
- **Bootstrap Scripts**: Automated installation of DevOps standards into application repositories

---

## Initial Setup Process

### For Application Teams

#### Step 1: Bootstrap DevOps Standards

Application teams use a single-command bootstrap process to install all DevOps standards:

```bash
# Download bootstrap script at the application root directory
git clone --depth 1 --no-checkout https://clicktime.symantec.com/15xX7FFXi5zgBt5HxzYYS?h=5Jda9MPUT50irx5weVmm8qLu9e0XJsMEnoRX4fs6D1A=&u=https://github.com/CRBG-PhoenixPOC/central-devops-config.git temp_bootstrap && cd temp_bootstrap && git checkout HEAD -- bootstrap.sh && cp bootstrap.sh ../bootstrap.sh && cd .. && rm -rf temp_bootstrap

# Run bootstrap
./bootstrap.sh

# Commit installed components
git commit -m "feat: add DevOps standards"
```

#### What Gets Installed

| Component | Files | Purpose |
|-----------|-------|---------|
| Git Hooks | pre-commit, commit-msg, pre-push | Code validation and Jira format enforcement |
| CI Workflows | ci-dev-template.yml | Continuous integration pipeline |
| CD Workflows | cd-uat-prod-template.yml | Deployment to UAT and production |
| PR Template | pull_request_template.md | Standardized pull request format |
| CODEOWNERS | CODEOWNERS | Code ownership and review assignments |
| Scan Scripts | sonar-analysis-generic.sh, codeql.sh | Local code quality analysis |
| ECS Manifests | ecs-manifest.yml | ECS deployment configuration |

#### Update Behavior

The bootstrap script implements smart update logic:

- **Git Hooks**: Always updated (policies may change)
- **Workflows**: Skipped if customized (preserves team changes)
- **PR Template**: Skipped if exists (preserves customizations)
- **CODEOWNERS**: Skipped if exists (preserves team ownership)
- **Manifests**: Skipped if exists (preserves project-specific configs)

### For Contributors to Central Repository

Contributors working on the central-devops-config repository must set up git hooks:

```bash
# Clone repository
git clone https://clicktime.symantec.com/15xX7FFXi5zgBt5HxzYYS?h=5Jda9MPUT50irx5weVmm8qLu9e0XJsMEnoRX4fs6D1A=&u=https://github.com/CRBG-PhoenixPOC/central-devops-config.git
cd central-devops-config

# Configure Git
git config core.hooksPath .githooks

# Verify installation
git config --get core.hooksPath
# Should output: .githooks
```

---

## Development Workflow

### Commit Message Standards

All commits must follow the Conventional Commits specification with Jira ticket references:

**Format**: `<type>: <JIRA-TICKET> <description>`

**Valid Types**:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code formatting
- refactor: Code restructuring
- test: Test additions or modifications
- chore: Maintenance tasks
- ci: CI/CD changes

**Examples**:
```
feat: PROJ-123 add user authentication module
fix: SCRUM-456 resolve null pointer exception in payment service
docs: DEV-789 update API documentation
```

### Git Hook Validation

#### Pre-Commit Hook

Validates code quality before allowing commits:

1. **YAML Syntax Validation**: Ensures all YAML files are syntactically correct
2. **Secret Scanning**: Detects hardcoded passwords, API keys, tokens, credentials
3. **Large File Detection**: Flags files larger than 10MB
4. **Trailing Whitespace**: Removes unnecessary whitespace
5. **Code Style Checks**: Language-specific linting (if applicable)

#### Commit-MSG Hook

Enforces commit message format:

1. Validates Conventional Commits format
2. Requires Jira ticket reference
3. Ensures descriptive commit messages

#### Pre-Push Hook

Final validation before pushing to remote:

1. Re-validates all commits in the push
2. Ensures no sensitive data is being pushed
3. Checks for merge conflicts

### Pull Request Process

1. **Create Feature Branch**: Branch from develop or main
2. **Implement Changes**: Make code changes following coding standards
3. **Local Validation**: Git hooks automatically validate on commit
4. **Push Branch**: Push feature branch to remote
5. **Create Pull Request**: Use standardized PR template
6. **Automated Checks**: CI pipeline runs automatically
7. **Code Review**: CODEOWNERS review and approve
8. **Merge**: Merge to target branch after approval

---

## CI/CD Pipeline Architecture

### Overview

The CI/CD pipeline is split into two main workflows:

1. **CI-Dev Pipeline**: Builds, tests, scans, and creates artifacts
2. **CD-UAT-Prod Pipeline**: Deploys artifacts to higher environments

### CI-Dev Pipeline Flow

```
1. Trigger
   ├── Push to develop/main
   ├── Pull request created/updated
   └── Manual trigger

2. Repository Compliance Check
   ├── Workflow file policy validation
   ├── CODEOWNERS presence check
   ├── Package source validation
   ├── Security scanning (secrets, large files)
   ├── Commit message validation
   └── PR title validation

3. Security Scanning (CodeQL)
   ├── Code coverage analysis
   ├── Code smell detection
   ├── Bug detection
   ├── Security hotspot identification
   └── Quality gate evaluation

4. Unit Testing & Code Coverage
   ├── Execute unit tests (XUnit, JUnit)
   ├── Generate code coverage reports (JaCoCo, Coverlet)
   ├── Validate coverage thresholds
   └── Quality gate check

5. Build Application
   ├── Language-specific SDK setup
   ├── Dependency resolution
   ├── Compilation
   ├── Unit test execution
   └── Artifact packaging

6. Docker Image Build
   ├── Download standardized Dockerfile
   ├── Build Docker image
   ├── Tag with commit SHA and branch
   ├── Save image as artifact
   └── Generate metadata

7. Container Security Scan (Prisma Cloud)
   ├── Load Docker image
   ├── Vulnerability scanning
   ├── Compliance checking
   ├── Quality gate evaluation
   └── Push to ECR if passed

8. Generate Outputs
   ├── IMAGE_TAG (for CD pipeline)
   ├── ECR_REGISTRY
   ├── ECR_REPOSITORY
   └── Scan results and reports
```

### CD-UAT-Prod Pipeline Flow

```
1. Trigger
   └── Automatic after successful CI-Dev completion

2. Download Artifacts
   ├── Retrieve IMAGE_TAG from CI workflow
   └── Load deployment metadata

3. Deploy to QA Environment
   ├── Blue-Green deployment preparation
   ├── Create new ECS task definition
   ├── Deploy to idle ECS service
   ├── Health check validation
   ├── Create temporary listener for testing
   └── Wait for approval

4. Manual Promotion (Optional)
   ├── Test new version on temporary port
   ├── Approve or reject deployment
   └── Switch traffic decision

5. Switch Traffic to Live
   ├── Update ALB listener rules
   ├── Route production traffic to new version
   ├── Monitor health metrics
   ├── Rollback capability if needed
   └── Decommission old version

6. Deploy to Production
   ├── Same blue-green process
   ├── Additional approval gates
   ├── Production health checks
   └── Final traffic switch
```

---

## Security and Compliance

### Repository Compliance Validation

The repository compliance template enforces organizational standards:

#### 1. Workflow File Policy

**Rules**:
- CODEOWNERS file must exist
- CODEOWNERS cannot be deleted
- Only approved workflows allowed: ci-dev-template.yml, cd-uat-prod-template.yml
- Custom workflows are prohibited

**Purpose**: Ensures standardized CI/CD processes and code review governance

#### 2. Package Source Validation

**Validated Configurations**:

| Technology | Configuration File | Allowed Sources |
|------------|-------------------|-----------------|
| Java/Maven | pom.xml | https://clicktime.symantec.com/15xXh4cWvPmq5VrkmuLan?h=RDdKbYRXN6Vcm1jkx8uwdTOlVWsL-lm2fKzBr6mSzes=&u=https://repo.maven.apache.org/maven2 |
| .NET | nuget.config | https://clicktime.symantec.com/15xVXTZ8zQ2QLvNkdNxie?h=0nGMhOj_Bh_OgxE0wsxqT14w8nKB1-k-WoiqZzAfmVg=&u=https://api.nuget.org/v3/index.json |
| Node.js | package.json, .npmrc | https://clicktime.symantec.com/15xXXQDx1AQeFcCugnYHY?h=cq6Hs9H0h9FN3gELuSrD18TsnaURFFr2cML_2oow4lQ=&u=https://registry.npmjs.org/ |

**Purpose**: Prevents use of untrusted package repositories and supply chain attacks

#### 3. Security Scanning

**Secret Detection Patterns**:
- password, secret, token
- api_key, api-key
- private_key, private-key
- access_key, access-key
- auth_token, bearer, oauth, jwt
- credential

**Large File Detection**: Files larger than 10MB are flagged

**Purpose**: Prevents credential exposure and repository bloat

#### 4. Commit and PR Validation

**Requirements**:
- All commits must reference Jira tickets
- PR titles must contain Jira ticket keys
- Conventional commit format required

**Purpose**: Ensures traceability and audit compliance

### CodeQL Security Scanning (GHAS)

**Overview**:
CodeQL is part of GitHub Advanced Security (GHAS) that performs semantic code analysis to identify security vulnerabilities and code quality issues.

**Key Features**:
- Deep semantic analysis of source code
- Query-based vulnerability detection
- Supports multiple programming languages
- Integration with GitHub Security tab
- Automatic pull request annotations

**Scan Coverage**:
- Security vulnerabilities (CWEs)
- Code injection flaws (SQL Injection, XSS, Path Traversal)
- Authentication and authorization issues
- Cryptographic weaknesses
- Remote code execution risks
- Data flow analysis
- Taint tracking for user inputs

**Languages Supported**:
- Java, C#/.NET, JavaScript/TypeScript
- Python, Go, C/C++, Ruby

**Quality Gate Configuration**:
- Set severity thresholds (CRITICAL, HIGH, MEDIUM, LOW)
- Fail builds based on vulnerability count
- Block PRs with security findings
- Custom queries for organization-specific patterns

**Integration**:
- Runs automatically on every push and PR
- Results appear in GitHub Security tab
- Generates SARIF reports for compliance
- Provides fix suggestions and remediation guidance

### Prisma Cloud Container Scanning

**Overview**:
Prisma Cloud provides comprehensive container security scanning for Docker images, identifying vulnerabilities, compliance issues, and misconfigurations.

**Key Features**:
- Automated vulnerability scanning
- Compliance framework validation
- Runtime protection insights
- License compliance checking
- Supply chain security analysis

**Scan Coverage**:
- Operating system CVEs (Common Vulnerabilities and Exposures)
- Application dependency vulnerabilities
- Embedded secrets and sensitive data
- Malware and suspicious binaries
- Configuration best practices
- Compliance violations (PCI-DSS, HIPAA, CIS benchmarks)

**Severity Thresholds**:

| Threshold | Description | Use Case |
|-----------|-------------|----------|
| CRITICAL | Only block on critical CVEs (CVSS 9.0-10.0) | Production-ready deployments |
| HIGH | Block on critical and high severity (CVSS 7.0+) | Standard security posture |
| MEDIUM | Block on medium and above (CVSS 4.0+) | Development environments |
| LOW | Block on all findings | Compliance-heavy industries |

**Quality Gate Enforcement**:
- Pre-deployment scanning before ECR push
- Automatic build failure on threshold breach
- Detailed vulnerability reports with fix versions
- Integration with Prisma Cloud console for trending

**Integration**:
- Scans Docker images post-build
- Blocks ECR push if quality gate fails
- Uploads findings to Prisma Cloud dashboard
- Generates compliance reports

---

## Deployment Process

### ECS Blue-Green Deployment

The deployment process uses a blue-green strategy for zero-downtime releases:

#### Architecture Components

- **ECS Cluster**: Container orchestration platform
- **Application Load Balancer (ALB)**: Traffic routing and distribution
- **Target Groups**: Blue and Green environments
- **ECS Services**: Blue (live) and Green (idle) services
- **Listeners**: Production (port 80/443) and temporary testing (port 8081)

#### Deployment Steps

**Step 1: Pre-Deployment Validation**
- Validate environment (dev, qa, prod)
- Validate application language
- Verify Docker image tag exists in ECR
- Configure AWS credentials using OIDC

**Step 2: Blue-Green Detection**
- Query current ALB listener rules
- Identify which service is LIVE (currently serving traffic)
- Identify which service is IDLE (available for deployment)
- Determine if this is the first deployment

**Step 3: Deploy to Idle Service**
- Create new ECS task definition with updated image tag
- Update idle ECS service with new task definition
- Set desired count to match production
- Wait for tasks to reach RUNNING state
- Perform health check validation

**Step 4: Create Temporary Test Listener**
- Create ALB listener on port 8081
- Route temporary listener to new (idle) target group
- Enable testing of new version before production switch
- Provide temporary endpoint for validation

**Step 5: Health Check Validation**
- Check ECS service stability
- Verify task health status
- Validate target group health
- Ensure minimum healthy task count
- Monitor CloudWatch metrics

**Step 6: Manual Promotion (Optional)**
- Stakeholders test new version on temporary port
- Approve or reject deployment
- Decision point for traffic switch

**Step 7: Switch Production Traffic**
- Update ALB production listener rules
- Route all traffic from blue to green
- New version becomes LIVE
- Old version becomes IDLE
- Delete temporary test listener

**Step 8: Post-Deployment Validation**
- Monitor application metrics
- Check error rates and latency
- Verify successful traffic switch
- Keep old version available for rollback

#### Rollback Process

If issues are detected after deployment:

1. **Immediate Rollback**: Switch ALB listener back to previous version
2. **No Redeployment**: Previous version still running in idle service
3. **Fast Recovery**: Traffic switch completes in seconds
4. **Investigation**: Analyze logs and metrics for root cause

#### First Deployment Scenario

For new applications without existing infrastructure:

1. **Single Service Deployment**: Deploy to blue service only
2. **No Traffic Switch**: Directly route production listener to blue
3. **Establish Baseline**: Create initial production configuration
4. **Subsequent Deployments**: Follow standard blue-green process

---

## Quality Assurance

### CodeQL Code Quality & Security Scanning

**Analysis Coverage**:
- Code coverage percentage
- Code duplication detection
- Code complexity metrics
- Code smells and anti-patterns
- Bug detection
- Security vulnerabilities
- Technical debt calculation

**Quality Gates**:
- Minimum code coverage threshold
- Maximum code duplication percentage
- Security rating requirements
- Reliability rating requirements
- Maintainability rating requirements

**Integration**:
- Runs during CI pipeline
- Blocks merge if quality gate fails
- Generates detailed analysis reports
- Tracks quality trends over time

### Local Scanning Capabilities

Application teams can run local scans before pushing code:

```bash
# Run CodeQL scan locally
./localscans/codeql.sh

# Generic analysis for any language
./localscans/sonar-analysis-generic.sh
```

**Benefits**:
- Early detection of quality issues
- Faster feedback loop
- Reduced CI/CD failures
- Developer empowerment

### Unit Testing and Code Coverage

**Testing Frameworks**:
- **Java**: JUnit 5, TestNG
- **.NET**: xUnit, NUnit, MSTest
- **Node.js**: Jest, Mocha, Jasmine
- **Python**: pytest, unittest

**Code Coverage Tools**:
- **Java**: JaCoCo
- **.NET**: Coverlet
- **Node.js**: Istanbul/nyc
- **Python**: Coverage.py

**Coverage Metrics**:
- Line coverage percentage
- Branch coverage percentage
- Method/function coverage
- Class coverage

**Quality Standards**:
- Minimum coverage threshold enforcement (typically 80%)
- Coverage reports integrated into CI pipeline
- Trend analysis and coverage degradation detection

**Integration**:
- Executes during build process
- Generates coverage reports (HTML, XML, JSON)
- Fails builds if coverage drops below threshold
- Reports published to GitHub Actions artifacts

### Integrated Quality and Security Pipeline

**Complete Validation Workflow**:
1. **Repository Compliance**: Validates organizational standards and policies
2. **CodeQL (SAST)**: Scans source code for security vulnerabilities (See [Security and Compliance](#security-and-compliance))
3. **Unit Testing**: Executes automated tests with coverage analysis
4. **Build Process**: Compiles application and creates artifacts
5. **Docker Image Build**: Packages application into container
6. **Prisma Cloud**: Scans container for vulnerabilities (See [Security and Compliance](#security-and-compliance))
7. **ECR Push**: Deploys only compliant images to registry

**Quality Standards**:
- Code coverage: Minimum 80% threshold
- Unit tests: All tests must pass
- Security scans: No critical/high vulnerabilities
- Compliance: All policies enforced

**Best Practices**:
- Run local scans before committing code
- Address test failures immediately
- Maintain high code coverage standards
- Review and fix security findings promptly

---

## Troubleshooting and Support

### Common Issues and Solutions

#### Bootstrap Installation Issues

| Issue | Solution |
|-------|----------|
| "Not in git repository" | Run from project root directory |
| "Failed to access DevOps repo" | Check network connectivity and GitHub access |
| Hooks not working | Verify: `git config --get core.hooksPath` |
| Files not staged | Manually stage: `git add .githooks/ .github/ localscans/ manifest/` |

#### Git Hook Failures

| Issue | Solution |
|-------|----------|
| Invalid commit message format | Use: `<type>: <JIRA-TICKET> <description>` |
| Missing Jira ticket | Add valid Jira ticket key to commit message |
| YAML validation failed | Fix syntax errors in YAML files |
| Hardcoded secrets detected | Remove sensitive data from files |
| Large file detected | Use Git LFS or reduce file size |

#### CI Pipeline Failures

| Issue | Solution |
|-------|----------|
| Compliance check failed | Review compliance report and fix violations |
| CodeQL scan failed | Review security findings and remediate vulnerabilities |
| Docker build failed | Check Dockerfile syntax and build logs |
| Prisma scan failed | Address container vulnerabilities or adjust threshold |
| Unit tests failed | Fix failing tests and improve code coverage |

#### Deployment Issues

| Issue | Solution |
|-------|----------|
| ECS tasks not starting | Check task definition, resource limits, and logs |
| Health check failures | Verify application startup and health endpoint |
| Image not found in ECR | Ensure CI pipeline completed successfully |
| ALB routing issues | Verify target group and listener configurations |
| Rollback needed | Use manual promotion workflow to switch back |

### Verification Commands

**Check Git Hook Installation**:
```bash
git config --get core.hooksPath
ls -la .githooks/
```

**Verify Installed Components**:
```bash
ls -la .github/workflows/
ls -la .github/
ls -la localscans/
ls -la manifest/
```
---

## Best Practices

### Development

1. **Commit Frequently**: Make small, atomic commits with clear messages
2. **Run Local Scans**: Use local scan scripts before pushing
3. **Keep Dependencies Updated**: Regularly update packages and dependencies
4. **Follow Naming Conventions**: Use consistent file and variable naming
5. **Document Changes**: Update documentation with code changes

### CI/CD

1. **Monitor Pipeline Runs**: Review failed builds promptly
2. **Address Security Findings**: Prioritize critical and high severity issues
3. **Maintain Quality Gates**: Don't bypass quality gates without approval
4. **Review Scan Reports**: Understand and address identified issues
5. **Test Before Merge**: Ensure all checks pass before merging PRs

### Deployment

1. **Test on Temporary Endpoint**: Validate new versions before traffic switch
2. **Monitor Post-Deployment**: Watch metrics after traffic switch
3. **Keep Rollback Ready**: Ensure previous version remains available
4. **Document Deployments**: Record deployment activities and issues
5. **Communicate Changes**: Notify stakeholders of deployments

### Security

1. **Never Commit Secrets**: Use GitHub Secrets for sensitive data
2. **Review Security Scans**: Address all security findings
3. **Use Approved Sources**: Only use approved package repositories
4. **Follow Least Privilege**: Grant minimum necessary permissions
5. **Regular Security Reviews**: Periodically audit security configurations

---

## Appendix

### Required GitHub Secrets

**Organization/Repository Level**:

| Secret | Description | Required For |
|--------|-------------|--------------|
| ORG_PHOENIX_APP_PRIVATE_KEY | GitHub App private key | Cross-repo workflow access |
| PRISMA_ACCESS_KEY | Prisma Cloud access key | Container security scanning |
| PRISMA_SECRET_KEY | Prisma Cloud secret key | Container security scanning |

**Environment Level** (dev, qa, prod):

| Secret | Description | Required For |
|--------|-------------|--------------|
| AWS_ROLE_ARN | AWS IAM role for OIDC | AWS resource access |
| ECS_CLUSTER_NAME | ECS cluster name | ECS deployments |
| ECS_SERVICE_BLUE | Blue service name | Blue-green deployments |
| ECS_SERVICE_GREEN | Green service name | Blue-green deployments |
| ALB_LISTENER_ARN | ALB listener ARN | Traffic routing |
| TARGET_GROUP_BLUE | Blue target group ARN | Load balancing |
| TARGET_GROUP_GREEN | Green target group ARN | Load balancing |

### Workflow Reference

**Available Reusable Workflows**:

1. **ci-dev-template.yml**: Full CI pipeline for development
2. **cd-uat-prod-template.yml**: CD pipeline for UAT and production
3. **docker-build-template.yml**: Multi-language Docker image building
4. **docker-image-scan-template.yml**: Prisma Cloud container scanning
5. **codeql-template.yml**: Static security and code quality analysis
6. **repository-compliance-template.yml**: Repository compliance validation
7. **ecs-deployment-template.yml**: ECS blue-green deployment
8. **unit-testing-template.yml**: Multi-platform unit testing with coverage
9. **manual-promotion-template.yml**: Manual deployment approval
10. **main-pipeline-template.yml**: Orchestrates complete CI/CD pipeline

### Contact and Support

- **DevOps Team**: For questions about workflows and templates
- **Security Team**: For security scanning and compliance issues
- **Infrastructure Team**: For deployment and AWS infrastructure questions

---

**Document Version**: 1.0  
**Last Updated**: January 13, 2026  
**Maintained By**: Central DevOps Team
