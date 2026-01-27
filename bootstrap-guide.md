#!/bin/bash
# bootstrap.sh - Application Repository DevOps Bootstrap
# Purpose: Validate repository environment and fetch DevOps standards
# Usage: Copy this file to your application root and run: ./bootstrap.sh

DEVOPS_REPO="https://clicktime.symantec.com/15xrrBMmXPqvbTZYgcGXv?h=irOoJkshGhNL-cq7qfwS-m3_bmVaGxgzHDSYZN7i62I=&u=https://github.com/CRBG-PhoenixPOC/central-devops-config.git%22

echo "🚀 Setting up DevOps organizational standards..."

# ✅ Repository validation (git directory check)
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run from your project root."
    exit 1
fi

# ✅ DevOps repository sparse checkout (fetch only required files)
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"
git init --quiet
git remote add origin "$DEVOPS_REPO"
git config core.sparseCheckout true
 # Specify the files/folders you want to fetch below (edit as needed)
echo "bootstrap-githooks-setup.sh" >> .git/info/sparse-checkout
echo "localscans/sonar-analysis-generic.sh" >> .git/info/sparse-checkout
echo "localscans/codeql.sh" >> .git/info/sparse-checkout
echo ".github/workflows/ci-dev-template.yml" >> .git/info/sparse-checkout
echo ".github/workflows/cd-uat-prod-template.yml" >> .git/info/sparse-checkout
echo ".github/CODEOWNERS" >> .git/info/sparse-checkout
echo ".github/pull_request_template.md" >> .git/info/sparse-checkout
echo "manifest/ecs-manifest.yml" >> .git/info/sparse-checkout
echo ".githooks/commit-msg" >> .git/info/sparse-checkout
echo ".githooks/pre-commit" >> .git/info/sparse-checkout
echo ".githooks/pre-push" >> .git/info/sparse-checkout
echo ".gitignore" >> .git/info/sparse-checkout

git pull --depth 1 origin main --quiet 2>/dev/null
cd - > /dev/null

# Call the installation script from the central repository
if [ -f "$TEMP_DIR/bootstrap-githooks-setup.sh" ]; then
    bash "$TEMP_DIR/bootstrap-githooks-setup.sh" "$TEMP_DIR"
    INSTALL_SUCCESS=$?
else
    echo "❌ bootstrap-githooks-setup.sh not found in central repository"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"

if [ $INSTALL_SUCCESS -eq 0 ]; then
    echo ""
    echo "✅ DevOps bootstrap completed successfully!"
else
    echo ""
    echo "❌ DevOps installation encountered errors."
    exit 1
fi
