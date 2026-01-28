#!/bin/bash
# Bootstrap GitHooks Setup Script
# DevOps hooks and workflow installation

# Expects TEMP_DIR as first parameter
TEMP_DIR="$1"

if [ -z "$TEMP_DIR" ]; then
    echo "❌ Error: Installation directory not provided"
    exit 1
fi

# Create directories and copy files
mkdir -p .githooks .github/workflows localscans manifest

echo "📋 Installing DevOps hooks, workflows, scan files and manifests..."

# Copy hooks
HOOKS_COPIED=0
echo "📁 Processing Git hooks..."

# Copy all hook files from central repository
for hook_file in pre-commit commit-msg pre-push; do
    if [ -f "$TEMP_DIR/.githooks/$hook_file" ]; then
        if [ ! -f ".githooks/$hook_file" ]; then
            echo "  📄 Installing $hook_file"
            cp "$TEMP_DIR/.githooks/$hook_file" ".githooks/$hook_file"
            chmod +x ".githooks/$hook_file"
            ((HOOKS_COPIED++))
        else
            echo "  🔄 Updating $hook_file"
            cp "$TEMP_DIR/.githooks/$hook_file" ".githooks/$hook_file"
            chmod +x ".githooks/$hook_file"
            ((HOOKS_COPIED++))
        fi
    fi
done

# Copy workflows
WORKFLOWS_COPIED=0
echo "📁 Processing GitHub workflows..."
for workflow in ci-dev-template.yml cd-uat-prod-template.yml; do
    if [ -f "$TEMP_DIR/.github/workflows/$workflow" ]; then
        if [ ! -f ".github/workflows/$workflow" ]; then
            echo "  📄 Installing $workflow"
            cp "$TEMP_DIR/.github/workflows/$workflow" ".github/workflows/$workflow"
            ((WORKFLOWS_COPIED++))
        else
            echo "  ℹ️  $workflow already exists - skipping"
        fi
    else
        echo "  ⚠️  Warning: $workflow not found in central repository"
    fi
done

# Copy PR templates
echo "📁 Processing pull request templates..."
if [ -f "$TEMP_DIR/.github/pull_request_template.md" ]; then
    if [ ! -f ".github/pull_request_template.md" ]; then
        echo "  📄 Installing pull_request_template.md"
        cp "$TEMP_DIR/.github/pull_request_template.md" ".github/pull_request_template.md"
        ((WORKFLOWS_COPIED++))
    else
        echo "  ℹ️  pull_request_template.md already exists - skipping"
    fi
else
    echo "  ⚠️  Warning: pull_request_template.md not found in central repository"
fi

# Copy CODEOWNERS file
echo "📁 Processing CODEOWNERS file..."
if [ -f "$TEMP_DIR/.github/CODEOWNERS" ]; then
    if [ ! -f ".github/CODEOWNERS" ]; then
        echo "  📄 Installing CODEOWNERS"
        cp "$TEMP_DIR/.github/CODEOWNERS" ".github/CODEOWNERS"
        ((WORKFLOWS_COPIED++))
    else
        echo "  ℹ️  CODEOWNERS already exists - skipping"
    fi
else
    echo "  ⚠️  Warning: CODEOWNERS not found in central repository"
fi

# Copy localscan files
LOCALSCAN_COPIED=0
echo "📁 Processing local scan scripts..."
for scan_file in sonar-analysis-generic.sh codeql.sh; do
    if [ -f "$TEMP_DIR/localscans/$scan_file" ]; then
        if [ ! -f "localscans/$scan_file" ]; then
            echo "  🔍 Installing localscans/$scan_file"
            cp "$TEMP_DIR/localscans/$scan_file" "localscans/$scan_file"
            chmod +x "localscans/$scan_file"
            ((LOCALSCAN_COPIED++))
        else
            echo "  ℹ️  localscans/$scan_file already exists - skipping"
        fi
    else
        echo "  ⚠️  Warning: localscans/$scan_file not found in central repository"
    fi
done

# Copy manifest files
MANIFEST_COPIED=0
echo "📁 Processing manifests..."
for manifest_file in ecs-manifest.yml; do
    if [ -f "$TEMP_DIR/manifest/$manifest_file" ]; then
        if [ ! -f "manifest/$manifest_file" ]; then
            echo "  ☸️  Installing manifest/$manifest_file"
            cp "$TEMP_DIR/manifest/$manifest_file" "manifest/$manifest_file"
            ((MANIFEST_COPIED++))
        else
            echo "  ℹ️  manifest/$manifest_file already exists - skipping"
        fi
    else
        echo "  ⚠️  Warning: manifest/$manifest_file not found in central repository"
    fi
done

# Copy .gitignore file
echo "📄 Processing .gitignore file..."
if [ -f "$TEMP_DIR/.gitignore" ]; then
    if [ ! -f ".gitignore" ]; then
        echo "  📄 Installing .gitignore"
        cp "$TEMP_DIR/.gitignore" ".gitignore"
    else
        echo "  ℹ️  .gitignore already exists - skipping"
    fi
else
    echo "  ⚠️  Warning: .gitignore not found in central repository"
fi

# Copy configure-githooks.sh file
echo "📄 Processing configure-githooks.sh file..."
if [ -f "$TEMP_DIR/configure-githooks.sh" ]; then
    if [ ! -f "configure-githooks.sh" ]; then
        echo "  📄 Installing configure-githooks.sh"
        cp "$TEMP_DIR/configure-githooks.sh" "configure-githooks.sh"
    else
        echo "  ℹ️  configure-githooks.sh already exists - skipping"
    fi
else
    echo "  ⚠️  Warning: configure-githooks.sh not found in central repository"
fi

# Configure Git
git config core.hooksPath .githooks

# Show results
echo "✅ Installed: $HOOKS_COPIED hooks, $WORKFLOWS_COPIED workflows & templates, $LOCALSCAN_COPIED scan scripts, $MANIFEST_COPIED manifests"

# Stage DevOps files for commit
echo "📋 Staging DevOps standards..."
git add .githooks/ .github/workflows/ localscans/ manifest/
echo "✅ Files staged - ready for commit"

# Final summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "📋 Git Hooks: $HOOKS_COPIED files in .githooks/"
echo "🔄 Workflows & Templates: $WORKFLOWS_COPIED files in .github/"
echo "🔍 Scans: $LOCALSCAN_COPIED files in localscans/"
echo "☸️  Manifests: $MANIFEST_COPIED files in manifest/"

# .gitignore summary
if [ -f ".gitignore" ]; then
    echo "📝 .gitignore: present in repository root"
else
    echo "📝 .gitignore: not present in repository root"
fi

# configure-githooks.sh summary
if [ -f "configure-githooks.sh" ]; then
    echo "📝 configure-githooks.sh: present in repository root"
else
    echo "📝 configure-githooks.sh: not present in repository root"
fi

echo ""
echo "Next steps:"
echo "• Verify: git config --get core.hooksPath"
echo "• Scans: ./localscans/sonar-analysis-generic.sh or ./localscans/codeql.sh"
echo "• Testing: git commit -m 'test: verify hooks'"
echo ""
echo "🔒 Organizational policies are now enforced!"
