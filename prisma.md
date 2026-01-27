# Prisma Cloud Integration Setup Guide

This guide explains how to configure Prisma Cloud scanning in your CI/CD pipeline.

## Prerequisites

1. **Prisma Cloud Account** - Active subscription
2. **Access Keys** - Generated from Prisma Cloud Console
3. **Console URL** - Your Prisma Cloud tenant URL

## Architecture Overview

```
┌─────────────────────────────────────┐
│  1. Build Application & Image       │
│  (docker-build-template.yml)        │
│  - Builds app artifacts              │
│  - Creates Docker image              │
│  - Saves image as artifact           │
└──────────────┬──────────────────────┘
               │
               │ Outputs: IMAGE_TAG, ECR_REGISTRY, etc.
               │ Artifact: docker-image.tar + metadata
               ▼
┌─────────────────────────────────────┐
│  2. Scan & Push to ECR              │
│  (docker-image-scan-template.yml)   │
│  - Downloads image artifact          │
│  - Runs Prisma Cloud security scan   │
│  - Gate check (fail on threshold)    │
│  - Pushes to ECR if passed           │
└─────────────────────────────────────┘
```

## Step 1: Generate Prisma Cloud Access Keys

1. Log in to your **Prisma Cloud Console**
2. Navigate to **Settings** → **Access Keys**
3. Click **+ Add New**
4. Provide a name (e.g., `GitHub-Actions-CI`)
5. Copy the **Access Key ID** and **Secret Key** immediately

---

## Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository or organization:

### Repository Level
1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `PRISMA_ACCESS_KEY` | Prisma Cloud Access Key ID | `12345678-1234-1234-1234-123456789012` |
| `PRISMA_SECRET_KEY` | Prisma Cloud Secret Key | `abcd1234efgh5678...` |
| `PRISMA_CONSOLE_URL` | Prisma Cloud Console URL | `https://clicktime.symantec.com/15xY7DawDUBo9DzNVhLKt?h=0XAYm3fH75KlRsRl4h3lSXvqlWN1zsgejFlOiZGf7lo=&u=https://us-east1.cloud.twistlock.com/us-1-123456789` |

### Organization Level (Recommended)
For multiple repositories, configure at organization level:
1. Go to **Organization Settings** → **Secrets and variables** → **Actions**
2. Add the same secrets as above
3. Grant access to required repositories

---

## Step 3: Find Your Prisma Cloud Console URL

Your console URL format depends on your tenant location:

### Prisma Cloud (SaaS)
- **US East:** `https://clicktime.symantec.com/15xYC3nDg5sPZApJ3FjUW?h=-JywW_0o5x2003dm5YO5LYUV2k2EVGAR20Tn9A1cwgQ=&u=https://us-east1.cloud.twistlock.com/us-1-XXXXXXXXX`
- **US West:** `https://clicktime.symantec.com/15xYGsyW8hYyy7eDap8d8?h=fa7D_QB6L6_T3p7Fd2rCuQ7dxmxowup2tpDh1ytOS_E=&u=https://us-west1.cloud.twistlock.com/us-2-XXXXXXXXX`
- **EU:** `https://clicktime.symantec.com/15xWwarxnrdVMzRSsskFC?h=2Kr-LVv6wdRXP1Rsa7hWz7FZcjcf1B3Jja2nd3zDdI4=&u=https://europe-west3.cloud.twistlock.com/eu-1-XXXXXXXXX`
- **APAC:** `https://clicktime.symantec.com/15xVh7whudPbAp2biVm1t?h=nbM8b9-LYe9bX_pnEV4gExH45M_5YR-xiET5eEry1UQ=&u=https://asia-northeast1.cloud.twistlock.com/asia-1-XXXXXXXXX`

### Prisma Cloud Compute (Self-Hosted)
- **Format:** `https://your-console-host:8083`

**How to find it:**
1. Log in to Prisma Cloud
2. Copy the URL from your browser (before `/dashboard`)
3. Example: `https://clicktime.symantec.com/15xY7DawDUBo9DzNVhLKt?h=0XAYm3fH75KlRsRl4h3lSXvqlWN1zsgejFlOiZGf7lo=&u=https://us-east1.cloud.twistlock.com/us-1-123456789`

---

## Step 4: Update Your Workflow

Use the scan template with Prisma secrets:

```yaml
jobs:
  build:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/docker-build-template.yml@main
    with:
      app-language: "dotnet"
      language-version: "8.0"
      docker-tech-image-tag: "8.0"
      environment: "dev"
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}

  scan-and-push:
    needs: build
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/docker-image-scan-template.yml@main
    with:
      ecr-registry: ${{ needs.build.outputs.ECR_REGISTRY }}
      ecr-repository: ${{ needs.build.outputs.ECR_REPOSITORY }}
      image-tag: ${{ needs.build.outputs.IMAGE_TAG }}
      environment: "dev"
      severity-threshold: "CRITICAL"
      run-image-scan-gate-check: "yes"
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}
      PRISMA_ACCESS_KEY: ${{ secrets.PRISMA_ACCESS_KEY }}
      PRISMA_SECRET_KEY: ${{ secrets.PRISMA_SECRET_KEY }}
      PRISMA_CONSOLE_URL: ${{ secrets.PRISMA_CONSOLE_URL }}
```

---

## Security Gate Configuration

### Severity Thresholds

| Threshold | Behavior | Use Case |
|-----------|----------|----------|
| `CRITICAL` | Fail only on critical vulnerabilities | Production environments |
| `HIGH` | Fail on critical + high | Staging/QA environments |
| `MEDIUM` | Fail on critical + high + medium | Development strict mode |
| `LOW` | Fail on all vulnerabilities | Compliance-heavy industries |

### Example: Environment-Specific Thresholds

```yaml
# Development - Lenient
severity-threshold: "HIGH"
run-image-scan-gate-check: "no"  # Scan but don't block

# Production - Strict
severity-threshold: "CRITICAL"
run-image-scan-gate-check: "yes"  # Fail build on critical CVEs
```

---

## Prisma Cloud Features Used

The workflow leverages these Prisma Cloud capabilities:

### 1. **Vulnerability Scanning**
- Comprehensive CVE database
- OS package vulnerabilities
- Application dependency scanning
- Risk scoring and prioritization

### 2. **Compliance Checks**
- CIS Docker Benchmark
- PCI-DSS requirements
- HIPAA compliance
- Custom policies

### 3. **Policy Enforcement**
- Configurable severity thresholds
- Custom vulnerability rules
- Compliance gates
- CI/CD integration

### 4. **Reporting**
- Detailed JSON output
- Human-readable reports
- GitHub workflow summaries
- Artifact retention (30 days)

---

## What Happens During Scan

1. **Download twistcli** - Prisma Cloud CLI tool fetched from console
2. **Authenticate** - Using access key + secret key
3. **Scan Image** - Analyzes layers, packages, and dependencies
4. **Generate Report** - JSON + text format
5. **Parse Results** - Extract vulnerability counts by severity
6. **Gate Check** - Compare against threshold
7. **Pass/Fail** - Proceed to ECR push or fail build

---

## Scan Output

### Workflow Summary (GitHub Actions UI)

```
🔐 Prisma Cloud Security Scan & Push Summary
Image: 123456789.dkr.ecr.us-east-2.amazonaws.com/myapp:myapp-a1b2c3d
Scanner: Prisma Cloud (twistcli)

📊 Vulnerability Report
| Severity    | Count |
|-------------|-------|
| 🔴 Critical | 0     |
| 🟠 High     | 2     |
| 🟡 Medium   | 15    |
| 🟢 Low      | 42    |
| ⚖️ Compliance| 1     |

Threshold: CRITICAL
Gate Check: passed
```

### Artifacts Available

- **prisma-scan-results.json** - Full JSON report with CVE details
- **prisma-scan-report.txt** - Human-readable scan output
- **Retention:** 30 days

---

## Troubleshooting

### Issue: "Failed to download twistcli"
**Cause:** Invalid console URL or credentials
**Solution:** 
- Verify `PRISMA_CONSOLE_URL` is correct
- Ensure access keys are valid and not expired
- Check network connectivity from GitHub runners

### Issue: "Scan returns 0 vulnerabilities but image has issues"
**Cause:** twistcli might not be scanning correctly
**Solution:**
- Check Prisma Cloud policies are configured
- Verify image exists in local Docker daemon
- Review twistcli version compatibility

### Issue: "Gate check fails unexpectedly"
**Cause:** Vulnerability threshold too strict
**Solution:**
- Review scan artifacts to see actual vulnerabilities
- Adjust `severity-threshold` input
- Set `run-image-scan-gate-check: "no"` temporarily

### Issue: "Authentication failed"
**Cause:** Expired or incorrect credentials
**Solution:**
- Regenerate access keys in Prisma Console
- Update GitHub secrets
- Verify secret names match exactly

---

## Best Practices

### 1. **Rotate Access Keys Regularly**
- Generate new keys every 90 days
- Use separate keys for different environments
- Revoke unused keys immediately

### 2. **Environment-Specific Policies**
```yaml
# Dev: Scan but don't block
severity-threshold: "HIGH"
run-image-scan-gate-check: "no"

# Prod: Strict enforcement
severity-threshold: "CRITICAL"
run-image-scan-gate-check: "yes"
```

### 3. **Monitor Scan Results**
- Review artifacts regularly
- Track vulnerability trends
- Update base images frequently

### 4. **Custom Policies (Advanced)**
Create custom policies in Prisma Cloud Console:
- Go to **Defend** → **Vulnerabilities** → **CI**
- Configure custom rules
- Link to specific repositories/tags

### 5. **Integration with Prisma Cloud Dashboards**
- Scanned images appear in Prisma Cloud Console
- View historical trends
- Track remediation progress
- Generate compliance reports

---

## Additional Resources

- [Prisma Cloud Documentation](https://clicktime.symantec.com/15xWcG5pxPu7iD7khe9ei?h=ILXhJMAVDoXvXO-yf3TRllvlpTZf6nlOMmTKmuZ_AtQ=&u=https://docs.paloaltonetworks.com/prisma/prisma-cloud)
- [twistcli Reference](https://clicktime.symantec.com/15xWmvUPsdGJY6mbnkwwx?h=PM8rMQseJw9D4DsTynOmvvm7dqSpIZxojDO4vFfi9vs=&u=https://docs.paloaltonetworks.com/prisma/prisma-cloud/prisma-cloud-admin-compute/tools/twistcli)
- [CI/CD Integration Guide](https://clicktime.symantec.com/15xWh6H7R1ai89wgFCYoL?h=TQa-s3urbILLeSM0OHGm0sZIpv9VSniFisw65mG0Mjc=&u=https://docs.paloaltonetworks.com/prisma/prisma-cloud/prisma-cloud-admin-compute/continuous_integration)
- [Vulnerability Management](https://clicktime.symantec.com/15xWrkfgLEwtx3bXLKM6a?h=E7BQMgLqQhEKjAIIyxpDO1vE4w_UrKep8j2EQUmxJBU=&u=https://docs.paloaltonetworks.com/prisma/prisma-cloud/prisma-cloud-admin-compute/vulnerability_management)

---

## Support

For issues with:
- **Prisma Cloud:** Contact Palo Alto Networks support
- **Workflow templates:** Create an issue in central-devops-config repository
- **GitHub Actions:** Check GitHub Actions documentation
