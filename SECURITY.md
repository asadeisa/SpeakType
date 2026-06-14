# Security Policy

We take the security of **SpeakType** seriously. Since SpeakType processes personal audio dictation, speech-to-text, and user authentication, protecting user data and privacy is one of our highest priorities.

This document describes how to report security vulnerabilities and what you can expect from us in response.

---

## Supported Versions

Currently, security updates and patches are focused on the active development branch of the repository:

| Version | Supported | Notes |
|---------|-----------|-------|
| `main` / `0.x` | ✅ Yes | Active development and pre-releases |
| `< 0.1` | ❌ No | Early prototypes and internal builds |

We recommend always running the latest version of the SpeakType extension and backend to ensure you have the latest security patches.

---

## Reporting a Vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

If you discover a security vulnerability in SpeakType, please report it privately through one of the following methods:

### Method 1: GitHub Private Vulnerability Reporting (Preferred)
GitHub supports private vulnerability reporting directly within the repository.
1. Navigate to the main page of the repository on GitHub (<https://github.com/asadeisa/SpeakType>).
2. Click on the **Security** tab.
3. Click on **Vulnerabilities** in the left sidebar.
4. Click **Report a vulnerability** to open a private advisory draft.

### Method 2: Direct Email
Alternatively, you can email the maintainer directly at:
* **asad.eisa.dev@gmail.com**

Please include as much detail as possible in your report, including:
* A description of the vulnerability and its potential impact.
* Detailed steps to reproduce (or a proof-of-concept exploit).
* Any specific configurations, environments, or browser versions required to trigger the issue.

---

## Our Disclosure Process

When we receive a valid security report, we will:
1. **Acknowledge:** Confirm receipt of the report within 48 hours.
2. **Investigate:** Assess the impact and validity of the issue.
3. **Fix:** Develop a fix or mitigation.
4. **Coordinate:** Work with the reporter to coordinate a release date for the fix.
5. **Publish:** Release the fix and publish a security advisory to inform the community.

Thank you for helping keep SpeakType and its users secure!
