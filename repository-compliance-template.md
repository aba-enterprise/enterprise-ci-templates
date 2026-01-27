# Repository Compliance Template

## Overview

The `repository-compliance-template.yml` is a **reusable GitHub Actions workflow** that enforces repository contribution compliance standards across all application repositories. It performs automated validation checks to ensure code quality, security, and organizational standards before code is merged.

### What This Template Does

This workflow performs comprehensive compliance validation:

1. **Workflow File Policy**: Enforces allowed workflow files and CODEOWNERS presence
2. **Project Type Detection**: Identifies technology stack (Java, .NET, Node.js, Python, Docker)
3. **Package Source Validation**: Ensures only approved package repositories are used
4. **Security Validation**: Scans for hardcoded secrets and oversized files
5. **Code Style Validation**: Performs project-specific syntax and style checks
6. **File Structure Validation**: Detects problematic OS-specific and temporary files
7. **Commit Message Validation**: Verifies Jira ticket references in all commits
8. **PR Title Validation**: Ensures pull request titles contain Jira ticket keys

## Purpose

- **Enforce Standards**: Ensure consistent contribution practices across all repositories
- **Security First**: Prevent secrets and sensitive data from being committed
- **Quality Gates**: Block non-compliant code before it reaches protected branches
- **Traceability**: Link all code changes to Jira tickets for audit trails
- **Governance**: Control workflow files and code source dependencies

## Quick Start

### Basic Usage

```yaml
# In your application repo: .github/workflows/ci-dev-template.yml
name: CI Development Pipeline

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop]

jobs:
  compliance-check:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/repository-compliance-template.yml@main
    with:
      base_branch: 'develop'
      jira_prefix: 'SCRUM'
```

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `base_branch` | string | Yes | - | Base branch for comparison (e.g., main, develop) |
| `jira_prefix` | string | No | `[A-Za-z][A-Za-z0-9]+-[0-9]+` | Jira project key prefix regex pattern |

### Jira Prefix Examples

```yaml
# Single project key
jira_prefix: 'SCRUM'    # Matches: SCRUM-123, SCRUM-456

# Multiple project keys
jira_prefix: '(SCRUM|PROJ|DEV)'  # Matches: SCRUM-123, PROJ-456, DEV-789

# Default (any Jira ticket)
jira_prefix: '[A-Za-z][A-Za-z0-9]+-[0-9]+'  # Matches: ANY-123, TICKET-456
```

## Validation Checks

### 1. Workflow File Policy

**What it validates:**
- `.github/CODEOWNERS` file must exist
- CODEOWNERS file cannot be deleted
- Only `ci-dev-template.yml` and `cd-uat-prod-template.yml` are allowed in `.github/workflows/`

**Why it matters:**
- Enforces standardized CI/CD workflows
- Ensures code review ownership is maintained
- Prevents custom workflows that bypass governance

**Failure example:**
```
[FAIL] .github/CODEOWNERS file must exist in the repository.
[FAIL] Deletion of CODEOWNERS file is not allowed.
[FAIL] File custom-workflow.yml is not allowed in .github/workflows/
```

### 2. Project Type Detection & Package Source Validation

**Supported Project Types:**
- **Java**: Detected by `pom.xml`, `build.gradle`, `build.gradle.kts`
- **Node.js**: Detected by `package.json`
- **.NET**: Detected by `*.csproj` or `*.sln` files
- **Python**: Detected by `requirements.txt`, `pyproject.toml`, `setup.py`
- **Docker**: Detected by `Dockerfile`
- **Generic**: Fallback for other project types

**Package Source Validation:**

| Project Type | Validated Files | Allowed Sources |
|--------------|----------------|-----------------|
| Java | `pom.xml` | `https://clicktime.symantec.com/15xXh4cWvPmq5VrkmuLan?h=RDdKbYRXN6Vcm1jkx8uwdTOlVWsL-lm2fKzBr6mSzes=&u=https://repo.maven.apache.org/maven2` |
| .NET | `nuget.config` | `https://clicktime.symantec.com/15xVXTZ8zQ2QLvNkdNxie?h=0nGMhOj_Bh_OgxE0wsxqT14w8nKB1-k-WoiqZzAfmVg=&u=https://api.nuget.org/v3/index.json` |
| Node.js | `package.json`, `.npmrc` | `https://clicktime.symantec.com/15xXXQDx1AQeFcCugnYHY?h=cq6Hs9H0h9FN3gELuSrD18TsnaURFFr2cML_2oow4lQ=&u=https://registry.npmjs.org/` |

**Why it matters:**
- Prevents use of untrusted or internal package repositories
- Ensures compliance with organizational security policies
- Blocks potential supply chain attacks

**Failure example:**
```
[FAIL] Disallowed Maven repository URLs found in pom.xml:
  - https://clicktime.symantec.com/15xY2PPekrWCjHASx8wBG?h=7FsAgeXTJvxCsaP7ajB-aZsL7Ger-xyFrtXYjE-yCHc=&u=https://untrusted-repo.example.com/maven2
```

### 3. Security Validation

**Secret Scanning:**
Detects potential hardcoded secrets in changed files using patterns:
- `password`
- `secret`
- `token`
- `api_key` / `api-key`
- `private_key` / `private-key`
- `access_key` / `access-key`
- `auth_token` / `auth-token`
- `bearer`
- `oauth`
- `jwt`
- `credential`

**Exclusions:** Comments, examples, placeholders, TODOs, FIXMEs

**Large File Detection:**
- Flags files larger than 10MB
- Recommends using Git LFS for large files

**Why it matters:**
- Prevents accidental credential exposure
- Protects sensitive data from version control
- Optimizes repository size

**Failure example:**
```
[FAIL] Potential hardcoded secrets detected!
Please review and remove any sensitive information

[WARN] Large files detected:
  data.bin (15728640 bytes)
Consider using Git LFS for large files
```

### 4. Code Style Validation

**Java Projects:**
- Validates Java file accessibility
- Warns about wildcard imports (`import java.util.*`)

**Node.js Projects:**
- Validates `package.json` syntax using JSON parser

**.NET Projects:**
- Verifies project files (`.csproj`, `.sln`) exist and are accessible

**Python Projects:**
- Performs basic syntax validation using `py_compile`

**Why it matters:**
- Catches syntax errors early
- Enforces code quality standards
- Prevents broken builds

**Warning example:**
```
[WARN] Wildcard imports found - consider specific imports
[WARN] Python syntax issues detected
```

### 5. File Structure Validation

**Detects problematic files:**
- **OS-specific**: `.DS_Store` (macOS), `Thumbs.db` (Windows), `desktop.ini` (Windows)
- **Temporary files**: `*.tmp`, `*.temp`, `*~`
- **Log files**: `*.log`

**Why it matters:**
- Keeps repository clean
- Prevents OS-specific files from polluting version control
- Reduces repository bloat

**Warning example:**
```
[WARN] Problematic files detected:
  OS-specific files (.DS_Store, Thumbs.db, desktop.ini)
  Temporary files (*.tmp, *.temp, *~)
  Log files (*.log)

Consider adding these to .gitignore
```

### 6. Commit Message Validation

**Requirements:**
- All commits must include Jira ticket key
- Format: `[JIRA-123] Commit message`
- Validates against configured `jira_prefix` pattern

**Validation scope:**
- **Pull Requests**: All commits in PR
- **Push Events**: Commits in the push
- **Workflow Dispatch**: Manual trigger commits

**Why it matters:**
- Ensures traceability from code to requirements
- Links commits to work items for audit purposes
- Enables automated release notes generation

**Failure example:**
```
Commits in range abc123..def456:
[PASS] [SCRUM-123] Add new feature
[FAIL] Fix bug (missing Jira key)
[PASS] [SCRUM-456] Update documentation

[FAIL] One or more commits do not include a Jira ticket. Please fix commit messages.
```

### 7. PR Title Validation

**Requirements:**
- Pull request title must contain Jira ticket key
- Format: `[SCRUM-123] PR title` or `SCRUM-123: PR title`
- Validates against configured `jira_prefix` pattern

**Why it matters:**
- Ensures PR traceability to Jira tickets
- Improves PR organization and searchability
- Maintains consistency across teams

**Failure example:**
```
PR title = Fix login bug
[FAIL] PR title missing Jira key: Fix login bug
```

**Success example:**
```
PR title = [SCRUM-123] Fix login authentication issue
[PASS] PR title contains Jira key: [SCRUM-123] Fix login authentication issue
```

## How It Works

### Workflow Execution Flow

1. **Checkout Repository** - Clone repository with full git history (`fetch-depth: 0`)
2. **Enforce Workflow Policy** - Validate CODEOWNERS and allowed workflow files
3. **Detect Project Type** - Identify technology stack and validate package sources
4. **Security Validation** - Scan for secrets and large files in changed files
5. **Code Style Validation** - Run project-specific syntax and style checks
6. **File Structure Validation** - Detect problematic OS-specific and temporary files
7. **Commit Message Validation** - Verify Jira ticket keys in all commits (PR/push events)
8. **PR Title Validation** - Check PR title for Jira ticket key (PR events only)
9. **Compliance Summary** - Display validation results and pass/fail status

### Validation Behavior

| Check Type | Severity | Action on Failure |
|------------|----------|-------------------|
| Workflow File Policy | **FAIL** | Blocks pipeline |
| Package Source Validation | **FAIL** | Blocks pipeline |
| Secret Detection | **FAIL** | Blocks pipeline |
| Code Style Validation | **FAIL** | Blocks pipeline |
| Commit Message Validation | **FAIL** | Blocks pipeline |
| PR Title Validation | **FAIL** | Blocks pipeline |
| Large File Detection | **WARN** | Continues with warning |
| File Structure Issues | **WARN** | Continues with warning |
| Code Style Warnings | **WARN** | Continues with warning |

## Output Summary

### Success Output

```
==================================
REPOSITORY CONTRIBUTION COMPLIANCE PASSED!
==================================
Validations completed:
  [PASS] Project Type Detection: PASSED
  [PASS] Security Validation: PASSED
  [PASS] Code Style Validation: PASSED
  [PASS] File Structure Validation: PASSED
  [PASS] Commit Message Validation: PASSED
  [PASS] PR Title Validation: PASSED
==================================
Ready for build and deployment!
```

### Conditional Validations

Some validations are skipped based on the event type:

- **Commit Message Validation**: Only runs on `pull_request`, `push`, `workflow_dispatch`
- **PR Title Validation**: Only runs on `pull_request`

```
Validations completed:
  [PASS] Project Type Detection: PASSED
  [PASS] Security Validation: PASSED
  [PASS] Code Style Validation: PASSED
  [PASS] File Structure Validation: PASSED
  [SKIP] Commit Message Validation: SKIPPED (not PR/push/manual event)
  [SKIP] PR Title Validation: SKIPPED (not PR event)
```

## Configuration

### Required Repository Files

Your repository must have:

```
.github/
├── CODEOWNERS           # Required - defines code review owners
└── workflows/
    ├── ci-dev-template.yml        # Allowed workflow file
    └── cd-uat-prod-template.yml   # Allowed workflow file
```

**CODEOWNERS Example:**
```
# Default owners for everything in the repo
*       @org-name/team-leads

# Specific paths
/docs/  @org-name/documentation-team
/src/   @org-name/backend-team
```

### Package Source Configuration

To customize allowed package sources, modify the workflow file arrays:

```yaml
# Allowed sources (add more as needed)
ALLOWED_MAVEN=("https://clicktime.symantec.com/15xXmtooP1TRVSggKTjjQ?h=rhzD03NF9ycjgs7zHQA1Sr8DPeboE7paaaKlVMCvEIA=&u=https://repo.maven.apache.org/maven2%26quot; "https://clicktime.symantec.com/15xXC5SpAhgGbpuDWYwh4?h=RYpqANThRm-IXjEFFsYkzbbFn51uiDep1kFgvjJD_zw=&u=https://internal.company.com/maven%22)
ALLOWED_NUGET=("https://clicktime.symantec.com/15xVcHkRT1hzksCgAwMsG?h=gFKO6CvoGYEYbv1O_JeqlA2OnF39V367uPbhaDlcgzU=&u=https://api.nuget.org/v3/index.json%26quot; "https://clicktime.symantec.com/15xXMjqP5w3TRiZ4bfjzJ?h=JmgphOOOStd1Gc89bzmUyBOg0FyNTzDoL15eGKjj0u0=&u=https://internal.company.com/nuget%22)
ALLOWED_NPM=("https://clicktime.symantec.com/15xXcERETn6EfZ2qELwSA?h=NX9K7QyaaybJK-kirWXB46ffoCjeaExcv0ixsnEh1Qg=&u=https://registry.npmjs.org/%26quot; "https://clicktime.symantec.com/15xXGue6dKMs1mj947Lqg?h=_F1T7ywBiOdtu9KEeQZKMvutrzvmlRrRLizkjD5c-nU=&u=https://internal.company.com/npm%22)
```

### Commit Message Format

**Valid commit message formats:**
```
[SCRUM-123] Add user authentication
SCRUM-456: Fix login bug
SCRUM-789 - Update documentation
```

**Invalid commit message formats:**
```
Add user authentication (no Jira key)
WIP: work in progress (no Jira key)
Fix bug (no Jira key)
```

## Troubleshooting

### Issue: "CODEOWNERS file must exist"

**Cause**: Repository is missing `.github/CODEOWNERS` file

**Solution**:
```bash
# Create CODEOWNERS file
mkdir -p .github
cat > .github/CODEOWNERS << 'EOF'
# Default owners
* @your-org/your-team
EOF

git add .github/CODEOWNERS
git commit -m "[PROJ-123] Add CODEOWNERS file"
```

### Issue: "File custom.yml is not allowed in .github/workflows/"

**Cause**: Custom workflow files are not permitted

**Solution**:
- Use only `ci-dev-template.yml` and `cd-uat-prod-template.yml`
- Remove or rename custom workflow files
- Contact DevOps team if additional workflows are needed

### Issue: "Disallowed Maven repository URLs found"

**Cause**: `pom.xml` references non-approved Maven repositories

**Solution**:
```xml
<!-- Update pom.xml to use approved repositories -->
<repositories>
    <repository>
        <id>central</id>
        <url>https://clicktime.symantec.com/15xXrj15qd91uPWbs28t2?h=gDDz6CMisIVmmsJc24_cfen6XmEscUOBIE3QIZGMkE8=&u=https://repo.maven.apache.org/maven2%3C/url%3E
    </repository>
</repositories>
```

### Issue: "Potential hardcoded secrets detected"

**Cause**: Code contains patterns matching secret keywords

**Solution**:
```java
// Bad - triggers secret detection
String dbConnection = "hardcoded_value_here";
String apiConfig = "hardcoded_api_value";

// Good - use environment variables
String dbConnection = System.getenv("DATABASE_URL");
String apiConfig = System.getenv("SERVICE_KEY");

// Good - example values with comments
String dbConnection = "example_value"; // example
String apiConfig = "TODO: Configure from environment";
```

### Issue: "Commit missing Jira key"

**Cause**: Commit message doesn't include Jira ticket reference

**Solution**:
```bash
# Amend the last commit message
git commit --amend -m "[SCRUM-123] Your commit message"

# For older commits, use interactive rebase
git rebase -i HEAD~3  # Rebase last 3 commits
# Then edit commit messages to include Jira keys
```

### Issue: "PR title missing Jira key"

**Cause**: Pull request title doesn't contain Jira ticket reference

**Solution**:
- Edit PR title to include Jira key: `[SCRUM-123] Feature description`
- Or use format: `SCRUM-123: Feature description`

## Best Practices

### 1. Always Include Jira Ticket References

```bash
# Good commit messages
git commit -m "[SCRUM-123] Add user login feature"
git commit -m "SCRUM-456: Fix authentication bug"

# Bad commit messages
git commit -m "Add login feature"
git commit -m "Bug fix"
```

### 2. Keep CODEOWNERS Updated

```
# Update CODEOWNERS when team structure changes
# Assign specific owners to critical paths
/src/security/  @security-team
/config/        @devops-team
```

### 3. Never Commit Secrets

```yaml
# Use GitHub Secrets
env:
  SERVICE_KEY: ${{ secrets.SERVICE_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

# Never hardcode
env:
  SERVICE_KEY: "hardcoded_value_here"  # BAD!
```

### 4. Use Approved Package Sources Only

```xml
<!-- pom.xml -->
<repositories>
    <repository>
        <id>central</id>
        <url>https://clicktime.symantec.com/15xXrj15qd91uPWbs28t2?h=gDDz6CMisIVmmsJc24_cfen6XmEscUOBIE3QIZGMkE8=&u=https://repo.maven.apache.org/maven2%3C/url%3E
    </repository>
    <!-- Don't add untrusted repositories -->
</repositories>
```

### 5. Follow Standard Workflow Structure

```
.github/
└── workflows/
    ├── ci-dev-template.yml     # Development/feature branch CI
    └── cd-uat-prod-template.yml # UAT/Production deployment
```

## Support

### Getting Help

- **Internal**: Contact DevOps team via [team-devops@company.com]
- **Documentation**: See central-devops-config repository README
- **Issues**: Create an issue in `CRBG-PhoenixPOC/central-devops-config`

### Common Questions

**Q: Can I add custom workflow files?**
A: No, only `ci-dev-template.yml` and `cd-uat-prod-template.yml` are allowed. Contact DevOps for exceptions.

**Q: How do I add a new approved package repository?**
A: Submit a request to DevOps team with business justification and security review.

**Q: What if I need to commit a large file?**
A: Use Git LFS (Large File Storage) for files larger than 10MB.

**Q: Can I bypass the Jira ticket requirement?**
A: No, all commits and PRs must reference valid Jira tickets for traceability.

**Q: What happens if compliance check fails?**
A: The pipeline stops and prevents merge/deployment until issues are resolved.

## Additional Resources

- [GitHub CODEOWNERS Documentation](https://clicktime.symantec.com/15xWXRtYVnDXJGHqA5kW6?h=W494FBbT5ekxphRTq8jTR_FUVTgvVH4eJs-DKVQK-14=&u=https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Git Best Practices](https://clicktime.symantec.com/15xX2R4FFUK5mwFNRS9Pp?h=B-LNDJd2P8XSIttGDlhUTOWAfDnmAmlxZJVqVtk6dzk=&u=https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project)
- [Conventional Commits](https://clicktime.symantec.com/15xYMiAnbKEaP4U98NXmk?h=-JHlQkPj6_28pyvNyKXFf3t8ytxvZ4zlPtl6sH9EIUs=&u=https://www.conventionalcommits.org/)
- [Semantic Versioning](https://clicktime.symantec.com/15xXwZCNJEpcKLLXQaY2e?h=aA8NT5u0QsQy29s5r7GJH9IfsScmDR17RyE6X9he_Wo=&u=https://semver.org/)

---

**Last Updated**: January 2026  
**Maintained By**: DevOps Team  
**Version**: 1.0
