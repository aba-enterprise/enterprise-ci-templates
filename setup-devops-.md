# Onboarding Instructions: Initial Project Setup

## Purpose
This guide explains how to set up your project for the first time by running a single curl command. This process is intended for the platform team or initial project maintainers.

## Steps

1. **Access the Private Repository**
   - Ensure you have access to the private GitHub repository containing the setup-devops script.

2. **Run the setup-devops Script with curl**
   - In your browser, go to:
     https://github.com/aba-enterprise/enterprise-ci-templates/blob/main/setup-devops.sh
   - Click the **"raw"** button to get the URL.
   - Copy the URL with the `?token=...` parameter from your browser's address bar.
   - Open a terminal in your project or application root directory.
   - Run the following command, replacing the URL with your copied link:
     ```sh
     curl -k -fsSL "PASTE_YOUR_BROWSER_GENERATED_URL_HERE" | bash -s --
     ```

3. **Verify Setup**
   - Check that the required files and folders have been created as expected.

## Notes
- The `?token=...` in the download link is temporary and only valid for your browser session.
- This method is suitable for one-time, manual onboarding by the platform team.

## Troubleshooting
- If you get a 404 error, double-check your repository access and the file path.
- If the script fails, ensure it has execute permissions and you are in the correct directory.

---
For further assistance, contact the platform engineering team.

