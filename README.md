
# Reusable CI/CD Pipeline

This repository contains a reusable GitHub Actions workflow for building, testing, and optionally publishing .NET applications as Docker images to GitHub Container Registry (GHCR).

## Features
- Supports .NET 8.0 builds
- Automatically discovers and runs test projects (`*Tests.csproj`)
- Optionally builds and pushes Docker images to GHCR
- Designed for enterprise-level reuse across multiple repositories

## Usage
To use this workflow in your repository, reference it in your workflow file:

```yaml
name: Use Enterprise CI/CD Template

on:
  push:
    branches: [ main ]

permissions:
  actions: read
  contents: read
  packages: write
  security-events: write

jobs:
  use-template:
    uses: aba-enterprise/enterprise-ci-templates/.github/workflows/dotnet-ci-template.yml@main
    with:
      project-path: './dotnet-ecs-sample/dotnet-ecs-sample.csproj'
      dockerfile-path: './dotnet-ecs-sample/Dockerfile'
      image-name: 'dotnet-ecs-sample'
```

## Inputs
| Name            | Description                                      | Required | Default |
|-----------------|--------------------------------------------------|----------|---------|
| `project-path`  | Path to the .NET project file (.csproj)         | ✅ Yes   | -       |
| `dockerfile-path` | Path to the Dockerfile for container build     | ❌ No    | `''`    |
| `image-name`    | Name of the Docker image to publish             | ❌ No    | `''`    |

## Permissions
Ensure the calling workflow includes the following permissions:
```yaml
permissions:
  actions: read
  contents: read
  packages: write
  security-events: write
```

## License
This project is licensed under the MIT License.
