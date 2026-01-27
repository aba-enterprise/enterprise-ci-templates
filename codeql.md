# CodeQL Security Scanning Template

## 📋 Overview

The `codeql-template.yml` is a **reusable GitHub Actions workflow** for automated security scanning using GitHub's CodeQL analysis engine. It detects security vulnerabilities, bugs, and code quality issues across multiple programming languages.

### What This Template Does

This workflow performs the following actions automatically:

1. **🔍 Analyzes Your Source Code**: Scans your application code for security vulnerabilities and code quality issues
2. **🛡️ Identifies Security Risks**: Detects SQL injection, XSS, command injection, authentication flaws, and 30+ other vulnerability types
3. **📊 Generates Security Reports**: Creates detailed findings with severity levels (Critical, High, Medium, Low)
4. **🚨 Enforces Quality Gates**: Blocks deployments when critical or high-severity vulnerabilities are found
5. **📈 Uploads to GitHub Security Tab**: Makes findings visible in your repository's Security section
6. **🔄 Integrates with CI/CD**: Runs automatically on pull requests and commits to prevent vulnerable code from merging

### Technical Implementation

The workflow uses **CodeQL**, GitHub's semantic code analysis engine that:
- Treats code as data by building an abstract syntax tree (AST)
- Queries the codebase using logical patterns to find vulnerabilities
- Understands code flow and data flow (not just regex pattern matching)
- Provides high-accuracy results with minimal false positives

## 🎯 Purpose

- **Automated Security Analysis**: Detect vulnerabilities before they reach production
- **Multi-Language Support**: Analyze 7+ programming languages
- **Quality Gates**: Block deployments with critical/high security findings
- **Centralized Governance**: Single template for all application repositories

## 🚀 Quick Start

### Basic Usage

```yaml
# In your application repo: .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  codeql-analysis:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/codeql-template.yml@main
    with:
      app-language: 'java'
      buildCommand: 'mvn clean package -DskipTests'
      run-codeql-gate-check: 'yes'
      language-version: '17'
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}
```

## 📥 Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `app-language` | string | ✅ Yes | `"auto"` | Programming language to scan (csharp, java, javascript, python, go, cpp, ruby) |
| `projectPath` | string | ❌ No | - | Project path for build (required for .NET or multi-project builds) |
| `buildCommand` | string | ❌ No | - | Optional custom build command. Leave empty to use autobuild for compiled languages |
| `run-codeql-gate-check` | string | ❌ No | `"yes"` | Enable/disable quality gate (`yes` or `no`) |
| `language-version` | string | ❌ No | - | Runtime version (e.g., Java 17, .NET 8) |

### Supported Languages

- `java` - Java
- `dotnet` (mapped to `csharp`) - C# / .NET
- `javascript` - JavaScript / TypeScript
- `python` - Python
- `go` - Go
- `cpp` - C / C++
- `ruby` - Ruby

## 📖 Usage Examples

### Example 1: Java Application with Maven

```yaml
jobs:
  security-scan:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/codeql-template.yml@main
    with:
      app-language: 'java'
      buildCommand: 'mvn clean package -DskipTests'
      run-codeql-gate-check: 'yes'
      language-version: '17'  # Java 17
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}
```

### Example 2: .NET Application

```yaml
jobs:
  security-scan:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/codeql-template.yml@main
    with:
      app-language: 'dotnet'
      projectPath: './src/MyApp/MyApp.csproj'
      buildCommand: 'dotnet build --configuration Release'
      run-codeql-gate-check: 'yes'
      language-version: '8'  # .NET 8
```

### Example 3: Node.js Application (No Build Required)

```yaml
jobs:
  security-scan:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/codeql-template.yml@main
    with:
      app-language: 'javascript'
      run-codeql-gate-check: 'yes'
```

### Example 4: Python Application

```yaml
jobs:
  security-scan:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/codeql-template.yml@main
    with:
      app-language: 'python'
      run-codeql-gate-check: 'yes'
```

### Example 5: Bypass Quality Gate (Development/Testing)

```yaml
jobs:
  security-scan:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/codeql-template.yml@main
    with:
      app-language: 'java'
      buildCommand: 'mvn clean package -DskipTests'
      run-codeql-gate-check: 'no'  # ⚠️ Allows deployment despite findings
```

## 🔍 What Does It Scan?

### Security Vulnerabilities

- **SQL Injection**: Unsafe database queries
- **Cross-Site Scripting (XSS)**: Unescaped user input
- **Path Traversal**: Unsafe file access
- **Command Injection**: Unsafe system command execution
- **Authentication Issues**: Weak password handling, session management
- **Cryptography Issues**: Weak encryption, hardcoded secrets
- **Deserialization**: Unsafe object deserialization
- **SSRF**: Server-Side Request Forgery
- **XXE**: XML External Entity attacks

### Code Quality Issues

- **Null Pointer Dereference**: Potential null reference errors
- **Resource Leaks**: Unclosed files, connections, streams
- **Concurrency Issues**: Race conditions, deadlocks
- **Error Handling**: Missing error checks, empty catch blocks
- **Code Smells**: Complex methods, duplicated code
- **Best Practice Violations**: Deprecated APIs, anti-patterns

## 📊 Severity Levels

CodeQL classifies findings by security severity:

| Severity | Impact | Quality Gate Action |
|----------|--------|---------------------|
| **Critical** | Immediate exploitation possible | ❌ **FAIL** pipeline |
| **High** | Significant security risk | ❌ **FAIL** pipeline |
| **Medium** | Moderate security concern | ⚠️ **WARN** (continues) |
| **Low** | Minor security issue | ℹ️ **INFO** (continues) |

## 🔧 How It Works

### Workflow Overview

The CodeQL workflow executes in the following key steps:

1. **Checkout Repository** - Clone application source code
2. **Generate GitHub App Token** - Create token for cross-repo access (if configured)
3. **Initialize CodeQL** - Set up CodeQL analysis environment with security-and-quality queries
4. **Setup Language Environment** - Configure Java/Maven settings (for Java projects)
5. **Restore Dependencies** - Download required packages (Java Maven dependencies, .NET NuGet packages)
6. **Build Project** - Compile code using autobuild or custom build command (for compiled languages)
7. **Perform CodeQL Analysis** - Scan code, generate findings, upload to GitHub Security tab
8. **Quality Gate Check** - Evaluate findings and fail pipeline if Critical/High issues found

### Key Steps Explained

#### 1. Initialize CodeQL
```yaml
- uses: github/codeql-action/init@v4
  with:
    languages: ${{ inputs.app-language == 'dotnet' && 'csharp' || inputs.app-language }}
    config: |
      queries:
        - uses: security-and-quality
```

**What it does:**
- Downloads CodeQL CLI tools and language-specific extractors
- Loads query packs with 200+ security patterns (OWASP Top 10, CWE mapping)
- Prepares the analysis environment

#### 2. Restore Dependencies (Conditional)

**For Java Projects:**
- Checks out central DevOps config for Maven settings
- Resolves Maven dependencies with GitHub authentication

**For .NET Projects:**
- Restores NuGet packages using `dotnet restore`

#### 3. Build Project

**Compiled Languages** (Java, C#, Go, C++):
- Executes custom build command if provided, otherwise uses autobuild
- Examples: `mvn clean package -DskipTests`, `dotnet build`

**Interpreted Languages** (JavaScript, Python, Ruby):
- No build step required

#### 4. Perform CodeQL Analysis
```yaml
- uses: github/codeql-action/analyze@v4
```

**What it does:**
- Extracts code and builds CodeQL database (AST, data flow, control flow)
- Runs 200+ security queries for vulnerability detection
- Generates SARIF file with findings, severity, and remediation guidance
- Uploads results to GitHub Security tab at `/security/code-scanning`

#### 5. Quality Gate Check
```bash
# Fetch alerts from GitHub API
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://clicktime.symantec.com/15xVSdMrXnLovyYq5pZa2?h=6gcezWKKNEfusErB_mpeb2v2Ta90v1Z3ldQdkkcdT2Y=&u=https://api.github.com/repos/%24%7BGITHUB_REPOSITORY%7D/code-scanning/alerts

# Count by severity
CRITICAL=$(jq '[.[] | select(.rule.security_severity_level=="critical")] | length' alerts.json)
HIGH=$(jq '[.[] | select(.rule.security_severity_level=="high")] | length' alerts.json)

# Fail pipeline if Critical or High findings exist
if [[ "$INPUT_RUN_ALERT_CHECK" == "yes" ]] && [[ "$CRITICAL" -gt 0 || "$HIGH" -gt 0 ]]; then
  exit 1
fi
```

**Quality Gate Logic:**
- Fetches code scanning alerts from GitHub API
- Counts alerts by severity level
- Fails pipeline if Critical or High severity issues found (when gate enabled)
- Displays summary in console and GitHub Step Summary

## 📈 Understanding Results

### Console Output

```bash
🔎 CodeQL Findings Summary:
  Critical: 0
  High:     2
  Medium:   5
  Low:      3
```

### GitHub Step Summary

Results are also displayed in the GitHub Actions UI:

```markdown
## 🔎 CodeQL Findings Summary
- Critical: **0**
- High: **2**
- Medium: 5
- Low: 3
```

### Viewing Detailed Findings

1. Navigate to: **Repository → Security → Code scanning**
2. Click on any alert to see:
   - Alert description and severity
   - Affected file and line number
   - Code flow visualization
   - Remediation guidance
   - Dismiss/fix options

## ⚙️ Configuration Options

### When to Use Quality Gate

**Enable (`run-codeql-gate-check: 'yes'`)** - Recommended for:
- ✅ Production deployments
- ✅ Main/master branch commits
- ✅ Release branches
- ✅ Pull requests to protected branches

**Disable (`run-codeql-gate-check: 'no'`)** - Consider for:
- ⚠️ Development branches (early iteration)
- ⚠️ Proof-of-concept code
- ⚠️ Temporary testing environments
- ⚠️ When fixing existing findings incrementally

### Build Commands by Language

**Java (Maven):**
```yaml
buildCommand: 'mvn clean package -DskipTests'
```

**Java (Gradle):**
```yaml
buildCommand: './gradlew build -x test'
```

**.NET:**
```yaml
buildCommand: 'dotnet build --configuration Release'
```

**Go:**
```yaml
buildCommand: 'go build ./...'
```

**C/C++:**
```yaml
buildCommand: 'make'
```

**Node.js/Python/Ruby:**
```yaml
# No build command needed - interpreted languages
```

## 🔒 Security & Permissions

### Required Permissions

The workflow requires these GitHub permissions:

```yaml
permissions:
  actions: read           # Read workflow runs
  contents: read          # Read repository code
  security-events: write  # Write findings to Security tab
```

### Secrets Used

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
  - Used for API calls to fetch code scanning alerts
  - Write access to security events for uploading results

## 🚨 Troubleshooting

### Issue: "No code found during build"

**Cause**: CodeQL couldn't extract code during the build process

**Solution**:
```yaml
# Provide explicit build command
with:
  buildCommand: 'mvn clean package -DskipTests'
```

### Issue: "Language auto-detection failed"

**Cause**: Repository contains multiple languages or ambiguous project structure

**Solution**:
```yaml
# Specify language explicitly
with:
  app-language: 'java'  # Don't use 'auto'
```

### Issue: "Quality gate fails but no alerts visible"

**Cause**: API timing issue - results not yet available

**Solution**:
- Wait a few minutes and re-check Security tab
- Alerts may take time to appear after analysis completes

### Issue: ".NET restore fails"

**Cause**: Project path not specified for multi-project solutions

**Solution**:
```yaml
with:
  app-language: 'csharp'
  projectPath: './src/MyApp/MyApp.csproj'  # Specify project file
```

### Issue: "Build takes too long / times out"

**Cause**: Full build with tests included

**Solution**:
```yaml
# Skip tests during security scan
buildCommand: 'mvn clean package -DskipTests'
```

## 📋 Best Practices

### 1. Run on Every Pull Request

```yaml
on:
  pull_request:
    branches: [main, develop]
```
Catch security issues before they're merged.

### 2. Enable Quality Gates for Production

```yaml
with:
  run-codeql-gate-check: 'yes'
```
Prevent vulnerable code from reaching production.

### 3. Review and Triage Findings Regularly

- Don't ignore alerts - review within 24-48 hours
- Dismiss false positives with documented reasons
- Create issues for real findings and track remediation

### 4. Use Specific Language Versions

```yaml
# ✅ Good
with:
  app-language: 'java'

# ❌ Avoid
with:
  app-language: 'auto'
```

### 5. Optimize Build Commands

```yaml
# ✅ Fast - skip tests
buildCommand: 'mvn clean package -DskipTests'

# ❌ Slow - runs all tests
buildCommand: 'mvn clean install'
```

### 6. Monitor Security Tab

- Review findings weekly
- Track remediation progress
- Use GitHub Projects for backlog management

## 📊 Metrics & Reporting

### Key Performance Indicators

Track these metrics for security posture:

- **Mean Time to Remediate (MTTR)**: Average time to fix findings
- **Finding Density**: Issues per 1000 lines of code
- **False Positive Rate**: % of dismissed alerts
- **Critical/High Findings**: Track trend over time
- **Scan Coverage**: % of repositories with CodeQL enabled

### Generating Reports

Use GitHub's Security Overview:
1. Navigate to: **Organization → Security → Overview**
2. View aggregate security metrics across all repositories
3. Export data for executive reporting

## 🆘 Support

### Getting Help

- **Internal**: Contact DevOps team via [team-devops@company.com]
- **GitHub Docs**: [CodeQL Documentation](https://clicktime.symantec.com/15xVwcXZHUSNQeWNMAxTk?h=a1bv1Y4vM34s4j5Xi_vbkyRsvLWoMgpUDzrcjTII3Lk=&u=https://codeql.github.com/docs/)
- **Issues**: Create an issue in `CRBG-PhoenixPOC/central-devops-config`

### Common Questions

**Q: How long does a scan take?**
A: Typically 5-15 minutes depending on codebase size and language.

**Q: Can I scan private dependencies?**
A: Yes, if your build can access them (e.g., via settings.xml for Maven).

**Q: Does this replace manual security reviews?**
A: No, CodeQL is a tool - expert review is still valuable for complex issues.

**Q: Can I customize the queries?**
A: Yes, but requires modifying the template. Contact DevOps team.

## 📚 Additional Resources

- [GitHub CodeQL Documentation](https://clicktime.symantec.com/15xVmx8zNF5BakrXG4AAW?h=Iv4owklJ1Fn7uGKHQUGqB1n3uoE3ixjOkTIV10pyMYc=&u=https://codeql.github.com/)
- [CodeQL Query Help](https://clicktime.symantec.com/15xVrnLGprkmzhgSocZK8?h=AXAesXRPplisP0bNjWechpuyC0GkFweVt7uVcdFuRk8=&u=https://codeql.github.com/codeql-query-help/)
- [OWASP Top 10](https://clicktime.symantec.com/15xXSa2fYYj3qfNz9E98v?h=E33WaBC4n37g8uZ2xOf-WOxk_g0BmzbilTiiHkpMJzY=&u=https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://clicktime.symantec.com/15xWSbhG3AXvtKTucXMMU?h=8hc0TOJ06i3zrhWaGErLQYO7srdTcUOI89lNDtbjfF0=&u=https://docs.github.com/en/code-security)

---

**Last Updated**: January 2026  
**Maintained By**: DevOps Team  
**Version**: 2.1
