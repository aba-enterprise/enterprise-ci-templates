# Docker Build & Push Template

## 📋 Overview

The `docker-build-push-template.yml` is a **reusable GitHub Actions workflow** that provides a comprehensive, multi-language containerization pipeline. It automates the entire process from building application artifacts to creating Docker images and pushing them to Amazon ECR (Elastic Container Registry).

### What This Template Does

This workflow performs end-to-end containerization:

1. **🔧 Environment Setup**: Configures language-specific SDKs (.NET, Java, Node.js, Python)
2. **📥 Central Config Integration**: Downloads standardized Dockerfile and Maven settings from central repository
3. **📦 Artifact Building**: Compiles and publishes application artifacts to standardized `output` folder
4. **🐳 Docker Image Creation**: Builds multi-architecture Docker images with proper tagging
5. **☁️ ECR Integration**: Automatically creates ECR repositories and pushes images
6. **🏷️ Smart Tagging**: Generates image tags based on service name, commit SHA, and branch
7. **📤 Output Artifacts**: Saves image tags for downstream CD workflows

## 🎯 Purpose

- **Multi-Language Support**: Single workflow for .NET, Java, Node.js, and Python applications
- **Standardization**: Enforces consistent containerization practices across all services
- **Automation**: Eliminates manual Docker build and push operations
- **Traceability**: Tags images with commit SHA and branch names for versioning
- **Integration**: Seamlessly connects CI build with CD deployment workflows

## 🚀 Quick Start

### Basic Usage - .NET Application

```yaml
# In your application repo: .github/workflows/ci-dev-template.yml
name: CI Pipeline

on:
  push:
    branches: [develop, main]

jobs:
  docker-build:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/docker-build-push-template.yml@main
    with:
      app-language: 'dotnet'
      language-version: '8'
      project-path: './src/MyApi'
      docker-tech-image-tag: 'mcr.microsoft.com/dotnet/aspnet:8.0'
      environment: 'dev'
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}
```

## 📥 Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `app-language` | string | ✅ Yes | - | Application language (`dotnet`, `java`, `node`, `python`) |
| `language-version` | string | ✅ Yes | - | Runtime version (e.g., .NET 8, Java 17, Node 20, Python 3.11) |
| `project-path` | string | ❌ No | `"."` | Project root path relative to repository root |
| `dockerfile-path` | string | ❌ No | `.devops-config/docker/Dockerfile` | Path to Dockerfile (auto-downloaded from central repo) |
| `docker-tech-image-tag` | string | ✅ Yes | - | Base Docker image tag (e.g., `mcr.microsoft.com/dotnet/aspnet:8.0`) |
| `aws-region` | string | ❌ No | `us-east-2` | AWS region for ECR |
| `environment` | string | ✅ Yes | `dev` | Deployment environment (`dev`, `qa`, `prod`) |
| `image-tag` | string | ❌ No | `github.sha` | Optional custom Docker image tag |

### Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `ORG_PHOENIX_APP_PRIVATE_KEY` | ❌ No | GitHub App private key for accessing central-devops-config repository |

### Outputs

| Output | Description |
|--------|-------------|
| `IMAGE_TAG` | Docker image tag used for the built image (e.g., `my-api-a1b2c3d`) |

## 📖 Usage Examples

### Example 1: .NET 8 API

```yaml
jobs:
  build-dotnet-api:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/docker-build-push-template.yml@main
    with:
      app-language: 'dotnet'
      language-version: '8'
      project-path: './src/MyApi'
      docker-tech-image-tag: 'mcr.microsoft.com/dotnet/aspnet:8.0'
      environment: 'dev'
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}
```

### Example 2: Java 17 Spring Boot Application

```yaml
jobs:
  build-java-app:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/docker-build-push-template.yml@main
    with:
      app-language: 'java'
      language-version: '17'
      project-path: '.'
      docker-tech-image-tag: 'eclipse-temurin:17-jre'
      environment: 'qa'
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}
```

### Example 3: Node.js 20 Application

```yaml
jobs:
  build-node-app:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/docker-build-push-template.yml@main
    with:
      app-language: 'node'
      language-version: '20'
      project-path: './app'
      docker-tech-image-tag: 'node:20-alpine'
      environment: 'prod'
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}
```

### Example 4: Python 3.11 Application

```yaml
jobs:
  build-python-app:
    uses: CRBG-PhoenixPOC/central-devops-config/.github/workflows/docker-build-push-template.yml@main
    with:
      app-language: 'python'
      language-version: '3.11'
      project-path: './backend'
      docker-tech-image-tag: 'python:3.11-slim'
      environment: 'dev'
    secrets:
      ORG_PHOENIX_APP_PRIVATE_KEY: ${{ secrets.ORG_PHOENIX_APP_PRIVATE_KEY }}
```
## 🔍 Supported Languages & Build Process

### .NET Applications

**Detection**: `.csproj` file in `project-path`

**Build Process**:
1. Searches for `.csproj` file
2. Runs `dotnet restore` to download NuGet packages
3. Runs `dotnet publish -c Release` to create deployment artifacts
4. Outputs to `{project-path}/output` folder

**NuGet Cache**: 
- Caches `~/.nuget/packages` folder
- Cache key: `${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}`

**Example Output**:
```
Searching for .csproj file in ./src/MyApi...
Found project: MyApi.csproj
Restoring NuGet packages...
Publishing application (Release configuration)...
Publish completed successfully in the Output folder
```

### Java Applications

**Detection**: `pom.xml` or `build.gradle` in `project-path`

**Build Process**:
1. Uses Maven Wrapper (`mvnw`) if available, otherwise system Maven
2. Runs `mvn clean package -DskipTests` to build JAR
3. Copies JAR files to `{project-path}/output` folder
4. Leverages cached Maven dependencies for faster builds

**Maven Cache**: 
- Caches `~/.m2/repository` and `target` folders
- Cache key: `${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}`

### Node.js Applications

**Detection**: `package.json` in `project-path`

**Build Process**:
1. Runs `npm install` to install dependencies
2. Runs `npm run build` to compile/bundle application
3. Copies `dist/*` contents to `{project-path}/output` folder

**Note**: Requires `build` script in `package.json`

### Python Applications

**Detection**: `requirements.txt`, `pyproject.toml`, or `setup.py`

**Build Process**:
1. Copies all project files to `{project-path}/output` folder
2. Dependencies installed during Docker build phase

## 🔧 How It Works

### Workflow Execution Flow

1. **Checkout Repository** - Clone application code
2. **Generate GitHub App Token** - Create token for accessing central-devops-config repository
3. **Download Central Config** - Clone Dockerfile and Maven settings from central repository
4. **Setup Language SDK** - Install .NET, Java, Node.js, or Python based on `app-language`
5. **Cache Dependencies** - Restore cached dependencies (NuGet for .NET, Maven for Java)
6. **Build Artifacts** - Compile/publish application to `output` folder
7. **Login to Registries** - Authenticate with GitHub Container Registry and Amazon ECR
8. **Configure AWS** - Assume IAM role using OIDC for ECR access
9. **Create ECR Repository** - Automatically create repository if it doesn't exist
10. **Build Docker Image** - Build image with build args and multiple tags
11. **Push to ECR** - Push tagged images to Amazon ECR
12. **Save Image Tag** - Upload image tag artifact for CD workflows

### Image Tagging Strategy

The workflow generates **two tags** for each Docker image:

**Tag 1: Service Name + Short Commit SHA**
```bash
IMAGE_TAG="${SERVICE_NAME}-${IMAGE_TAG_SHORT}"
# Example: my-api-service-a1b2c3d
```

**Tag 2: Service Name + Branch Name**
```bash
IMAGE_TAG_BRANCH="${SERVICE_NAME}-${BRANCH_NAME}"
# Example: my-api-service-main
```

**Variables Explained**:
- `SERVICE_NAME`: Extracted from repository name (`basename ${{ github.repository }}`)
- `IMAGE_TAG_SHORT`: First 7 characters of commit SHA (`$(echo $GITHUB_SHA | cut -c1-7)`)
- `BRANCH_NAME`: Current branch name (`${GITHUB_REF##*/}`)

**Example for repository `CRBG-PhoenixPOC/payment-api-service`**:
- Repository: `payment-api-service`
- Commit SHA: `a1b2c3d4e5f6789`
- Branch: `main`
- **Image Tag 1**: `payment-api-service-a1b2c3d`
- **Image Tag 2**: `payment-api-service-main`

### ECR Repository Auto-Creation

The workflow automatically creates ECR repositories if they don't exist:

```bash
if ! aws ecr describe-repositories --repository-names "$ECR_REPO" --region ${{ vars.AWS_REGION }} 2>/dev/null; then
  aws ecr create-repository \
    --repository-name "$ECR_REPO" \
    --region ${{ vars.AWS_REGION }} \
    --encryption-configuration encryptionType=AES256
fi
```

**Features**:
- ✅ Auto-creation on first run
- ✅ AES256 encryption enabled
- ✅ No manual ECR setup required
- ❌ Image scanning disabled (can be enabled if needed)

### Centralized Dockerfile

The workflow downloads a **standardized Dockerfile** from the central-devops-config repository:

**Download Step**:
```bash
git clone --depth 1 --branch main \
  https://x-access-token:${{ steps.generate-token.outputs.token }}@github.com/CRBG-PhoenixPOC/central-devops-config.git \
  central-devops-config-temp

cp central-devops-config-temp/docker/Dockerfile .devops-config/docker/Dockerfile
cp central-devops-config-temp/maven/settings.xml ~/.m2/settings.xml
```

**Benefits**:
- ✅ Consistent Docker image structure across all services
- ✅ Centralized updates - change once, apply everywhere
- ✅ Security best practices enforced
- ✅ Multi-stage builds for optimized image size

### Build Arguments Passed to Docker

The workflow passes these build arguments to the Dockerfile:

| Build Arg | Value | Description |
|-----------|-------|-------------|
| `APP_LANGUAGE` | `dotnet`/`java`/`node`/`python` | Application language type |
| `LANGUAGE_VERSION` | `docker-tech-image-tag` input | Base image tag (e.g., `mcr.microsoft.com/dotnet/aspnet:8.0`) |
| `APP_PATH` | `output` | Path to compiled artifacts inside build context |
| `ENVIRONMENT` | `dev`/`qa`/`prod` | Deployment environment |

**Example Docker Build Command**:
```bash
docker build \
  --build-arg APP_LANGUAGE="dotnet" \
  --build-arg LANGUAGE_VERSION="mcr.microsoft.com/dotnet/aspnet:8.0" \
  --build-arg APP_PATH="output" \
  --build-arg ENVIRONMENT="dev" \
  -f ".devops-config/docker/Dockerfile" \
  -t "123456789.dkr.ecr.us-east-2.amazonaws.com/my-api:my-api-a1b2c3d" \
  -t "123456789.dkr.ecr.us-east-2.amazonaws.com/my-api:my-api-main" \
  "./src/MyApi"
```

## 📊 Output Artifacts

### Image Tag Artifact

The workflow creates an artifact containing the image tag for use in CD workflows:

**Artifact Name**: `docker-image-tag`

**File**: `image-tag.env`

**Content Example**:
```
IMAGE_TAG=payment-api-service-a1b2c3d
```

## ⚙️ Configuration

### Required GitHub Repository Variables

Configure these variables in your GitHub repository or organization:

| Variable | Description | Example |
|----------|-------------|---------|
| `ORG_APP_ID` | GitHub App ID for cross-repo access | `123456` |
| `AWS_ACCOUNTID` | AWS Account ID | `123456789012` |
| `AWS_GITHUB_OIDC_ROLE` | IAM role name for GitHub OIDC | `GitHubActionsECSDeployRole` |
| `AWS_REGION` | AWS region for ECR | `us-east-2` |

### Required GitHub Repository Secrets at Orgnization Level

| Secret | Description |
|--------|-------------|
| `ORG_PHOENIX_APP_PRIVATE_KEY` | GitHub App private key (PEM format) |

### Project Structure Requirements

**For .NET Projects**:
```
your-repo/
├── src/
│   └── YourApi/
│       ├── YourApi.csproj  # Required
│       └── Program.cs
└── .github/
    └── workflows/
        └── ci-dev-template.yml
```

**For Java Projects**:
```
your-repo/
├── pom.xml              # Required
├── src/
│   └── main/
│       └── java/
└── .github/
    └── workflows/
        └── ci-dev-template.yml
```

**For Node.js Projects**:
```
your-repo/
├── package.json         # Required with "build" script
├── src/
└── .github/
    └── workflows/
        └── ci-dev-template.yml
```

**For Python Projects**:
```
your-repo/
├── requirements.txt     # Required
├── app/
│   └── main.py
└── .github/
    └── workflows/
        └── ci-dev-template.yml
```

## 🚨 Troubleshooting

### Issue: "No .csproj file found"

**Cause**: `project-path` doesn't point to the directory containing `.csproj` file

**Solution**:
```yaml
# ❌ Wrong - points to solution directory
project-path: '.'

# ✅ Correct - points to project directory
project-path: './src/MyApi'
```

### Issue: "Maven build failed"

**Cause**: Missing dependencies or incorrect Maven configuration

**Solution**:
1. Verify `pom.xml` is valid
2. Check Maven settings.xml has correct repository URLs
3. Ensure GitHub token has access to private packages
4. Review Maven build logs for specific errors

### Issue: "Docker build failed - output folder empty"

**Cause**: Build artifacts not published to `output` folder

**Solution**:
For .NET:
```bash
# Check if publish succeeded
dotnet publish -c Release -o ./output
ls -la ./output  # Should contain DLLs
```

For Java:
```bash
# Check if JAR was created
mvn clean package
ls -la target/*.jar
```

For Node.js:
```json
// Ensure package.json has build script
{
  "scripts": {
    "build": "tsc" // or your build command
  }
}
```

### Issue: "ECR push unauthorized"

**Cause**: IAM role lacks ECR permissions or OIDC trust not configured

**Solution**:
1. Verify IAM role has ECR permissions (see Configuration section)
2. Check OIDC provider exists in AWS IAM
3. Verify trust policy allows GitHub repository
4. Ensure `AWS_ACCOUNTID`, `AWS_GITHUB_OIDC_ROLE`, `AWS_REGION` variables are set

### Issue: "Image tag artifact not found in CD workflow"

**Cause**: Artifact not uploaded or wrong artifact name used

**Solution**:
```yaml
# Ensure artifact name matches exactly
- name: Download Image Tag
  uses: actions/download-artifact@v4
  with:
    name: docker-image-tag  # Must match workflow output
```

### Issue: "Build takes too long"

**Cause**: Dependencies not cached or large project size

**Solution**:
- **Java**: Maven cache is automatic - ensure `pom.xml` hasn't changed
- **.NET**: NuGet cache is automatic - ensure `.csproj` files haven't changed
- **Node.js**: Add npm cache:
  ```yaml
  - uses: actions/cache@v4
    with:
      path: ~/.npm
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
  ```

### Issue: "Docker image too large"

**Cause**: Inefficient Dockerfile or unnecessary files included

**Solution**:
1. Use `.dockerignore` to exclude unnecessary files:
   ```
   # .dockerignore
   .git
   .github
   node_modules
   */bin
   */obj
   *.log
   ```
2. Use multi-stage builds in Dockerfile
3. Choose slim/alpine base images when possible
4. Remove build dependencies in final stage

## 📋 Best Practices

### 1. Use Specific Language Versions

```yaml
# ✅ Good - specific version
language-version: '8'

# ❌ Avoid - may change over time
language-version: 'latest'
```

### 2. Match Base Image to Language Version

```yaml
# ✅ Good - .NET 8 app with .NET 8 runtime
app-language: 'dotnet'
language-version: '8'
docker-tech-image-tag: 'mcr.microsoft.com/dotnet/aspnet:8.0'

# ❌ Bad - version mismatch
app-language: 'dotnet'
language-version: '8'
docker-tech-image-tag: 'mcr.microsoft.com/dotnet/aspnet:6.0'
```

### 3. Use Environment-Specific Configurations

```yaml
# Development
environment: 'dev'

# Production
environment: 'prod'
```

### 4. Set Proper Project Path

```yaml
# ✅ For .NET - point to project directory
project-path: './src/PaymentApi'

# ✅ For Java - repository root with pom.xml
project-path: '.'

# ✅ For Node.js - where package.json is located
project-path: './backend'
```

### 5. Tag Images Appropriately

The workflow automatically creates two tags:
- **Immutable tag** (commit SHA) - for specific version deployment
- **Mutable tag** (branch name) - for latest version on branch

Both are useful:
```bash
# Deploy specific version
docker pull ecr-registry/my-api:my-api-a1b2c3d

# Deploy latest from main branch
docker pull ecr-registry/my-api:my-api-main
```

### 6. Review Build Logs

Always check the build artifacts output:
```
📦 Contents of output folder (./src/MyApi/output):
================================================
-rw-r--r-- 1 runner docker  45678 MyApi.dll
-rw-r--r-- 1 runner docker   2345 MyApi.deps.json
-rw-r--r-- 1 runner docker    456 appsettings.json
================================================
```

## 🆘 Support

### Getting Help

- **Internal**: Contact DevOps team via [team-devops@company.com]
- **Documentation**: See central-devops-config repository README
- **Issues**: Create an issue in `CRBG-PhoenixPOC/central-devops-config`

### Common Questions

**Q: Can I use a custom Dockerfile?**
A: Yes, set `dockerfile-path` input to your custom Dockerfile location. However, using the centralized Dockerfile is recommended for consistency.

**Q: How do I optimize Docker image size?**
A: The centralized Dockerfile uses multi-stage builds. Ensure your `.dockerignore` excludes unnecessary files. Use slim/alpine base images when possible.

**Q: What if my build needs additional steps?**
A: For complex builds, consider pre-building artifacts in a separate job and passing them to this workflow.

**Q: Can I push to multiple registries?**
A: Currently supports ECR and GitHub Container Registry (GHCR). Modify the workflow to add more registries.

**Q: How do I handle different environments (dev/qa/prod)?**
A: Use the `environment` input. This can trigger environment-specific approvals and configurations in GitHub.

**Q: What's the difference between the two image tags?**
A: The commit SHA tag (`my-api-a1b2c3d`) is immutable and specific. The branch tag (`my-api-main`) is mutable and always points to the latest image from that branch.

## 📚 Additional Resources

- [Docker Best Practices](https://clicktime.symantec.com/15xWC77QfKV9eUz8yr9uc?h=Cr1JUo7EmwzEAxfhMYKfr5TsDUUYDusdOUzR9U6geZk=&u=https://docs.docker.com/develop/dev-best-practices/)
- [Multi-Stage Builds](https://clicktime.symantec.com/15xW7Gv8ChoZEYADSHkkz?h=4ase8a1y6bbxf2TtPTPopQafBWIbr1KwDezugES-K9A=&u=https://docs.docker.com/build/building/multi-stage/)
- [Amazon ECR Documentation](https://clicktime.symantec.com/15xW2Siqk67xpbLHtjMcN?h=zlA8sY7Eyre-QbGiTd3OJGJ73EmlDxGzBXRAYn9kiE8=&u=https://docs.aws.amazon.com/ecr/)
- [GitHub Actions Reusable Workflows](https://clicktime.symantec.com/15xWMmVyaYrLUNdz4xxCr?h=bVOLxIcF0MkO0IF_K_aUskbsILzDxG7d20yVjHJmnFA=&u=https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [OIDC with GitHub Actions](https://clicktime.symantec.com/15xWGwJh7wAk4Rp4XQZ4E?h=XeVDi-sS6aUYe0JsELaWtV8bfpy9cg7gdyhvifKn6bU=&u=https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

---

**Last Updated**: January 2026  
**Maintained By**: DevOps Team  
**Version**: 1.0
