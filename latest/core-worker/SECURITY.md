# Security Guidelines for Core Voice Worker

## IMPORTANT: Never Commit Sensitive Data

This repository contains configuration files that should **NEVER** be committed with real credentials:

### Files That Should NEVER Be Committed:
- `.env` - Local development environment variables
- `.env.local` - Local overrides
- `.env.production` - Production environment variables
- Any file with real API keys, secrets, or credentials

### Files That Are Safe to Commit:
- `.env.template` - Template with placeholder values only
- All Python source code files
- `Dockerfile` and configuration files
- This `SECURITY.md` file

---

## Setting Up Environment Variables

### Step 1: Copy the Template
```bash
cp .env.template .env
```

### Step 2: Edit .env with Your Real Credentials
Open `.env` and replace all placeholder values with your actual credentials:

```bash
# LiveKit Configuration (GET FROM: https://cloud.livekit.io)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# Backend Configuration
BACKEND_URL=http://localhost:3000/api/v1

# AI Service API Keys
OPENAI_API_KEY=sk-your-openai-key
CARTESIA_API_KEY=your-cartesia-key
ASSEMBLYAI_API_KEY=your-assemblyai-key
DEEPGRAM_API_KEY=your-deepgram-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### Step 3: Verify .env is Ignored by Git
```bash
# This should show .env in the ignore list
git check-ignore .env

# Output should be: .env
```

---

## Deploying to Production

### Using deploy-production.sh Script

**NEVER hardcode credentials in the script!** Instead, set environment variables before running:

```bash
# Set all required environment variables
export GCP_PROJECT=your-gcp-project-id
export BACKEND_URL=https://your-production-backend.com
export LIVEKIT_URL=wss://your-project.livekit.cloud
export LIVEKIT_API_KEY=your-livekit-api-key
export LIVEKIT_API_SECRET=your-livekit-api-secret
export OPENAI_API_KEY=sk-your-openai-key
export CARTESIA_API_KEY=your-cartesia-key
export ASSEMBLYAI_API_KEY=your-assemblyai-key
export DEEPGRAM_API_KEY=your-deepgram-key

# Now run the deployment script
./deploy-production.sh
```

### Alternative: Create a Local Deployment Script (Gitignored)

Create `deploy-local.sh` (this will be gitignored):

```bash
#!/bin/bash
# deploy-local.sh - Local deployment script with your credentials
# This file is gitignored and should NEVER be committed

export GCP_PROJECT=your-actual-project-id
export BACKEND_URL=https://your-actual-backend.com
export LIVEKIT_URL=wss://your-actual-project.livekit.cloud
export LIVEKIT_API_KEY=your-actual-api-key
export LIVEKIT_API_SECRET=your-actual-secret
export OPENAI_API_KEY=sk-your-actual-key
export CARTESIA_API_KEY=your-actual-key
export ASSEMBLYAI_API_KEY=your-actual-key
export DEEPGRAM_API_KEY=your-actual-key

# Run the main deployment script
./deploy-production.sh
```

Then make it executable:
```bash
chmod +x deploy-local.sh
```

---

## Using Google Cloud Secret Manager (Recommended for Production)

For better security in production, use Google Cloud Secret Manager:

### Step 1: Create Secrets in GCP
```bash
# Create secrets in Google Cloud Secret Manager
echo -n "your-livekit-api-key" | gcloud secrets create LIVEKIT_API_KEY --data-file=-
echo -n "your-livekit-api-secret" | gcloud secrets create LIVEKIT_API_SECRET --data-file=-
echo -n "your-openai-key" | gcloud secrets create OPENAI_API_KEY --data-file=-
# ... repeat for other secrets
```

### Step 2: Update deploy-production.sh
Replace `--set-env-vars` with `--set-secrets`:

```bash
gcloud run deploy voice-agent-core-worker \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-secrets "\
LIVEKIT_API_KEY=LIVEKIT_API_KEY:latest,\
LIVEKIT_API_SECRET=LIVEKIT_API_SECRET:latest,\
OPENAI_API_KEY=OPENAI_API_KEY:latest"
```

---

## Before Committing to Git

### Pre-Commit Checklist:

1. **Verify no sensitive files are staged:**
   ```bash
   git status
   ```

   Make sure you DON'T see:
   - `.env`
   - `.env.production`
   - `.env.local`
   - Any files with credentials

2. **Check for hardcoded credentials in code:**
   ```bash
   # Search for potential API keys in staged files
   git diff --cached | grep -i "api_key\|secret\|password"
   ```

3. **Verify .gitignore is working:**
   ```bash
   git check-ignore .env .env.production .env.local
   ```
   All three should be listed as ignored.

4. **Review all changes:**
   ```bash
   git diff --cached
   ```
   Look for any hardcoded values that look like credentials.

---

## What If I Already Committed Secrets?

### If You Haven't Pushed Yet:
```bash
# Remove the file from the last commit
git reset HEAD~1
git rm --cached .env
git commit -m "Remove sensitive files"
```

### If You Already Pushed:

1. **IMMEDIATELY REVOKE ALL EXPOSED CREDENTIALS**
   - LiveKit: https://cloud.livekit.io → Settings → API Keys → Delete
   - OpenAI: https://platform.openai.com/api-keys → Revoke
   - Other services: Revoke exposed keys

2. **Remove from Git history:**
   ```bash
   # Install git-filter-repo
   pip install git-filter-repo

   # Remove the sensitive file from all history
   git filter-repo --path .env --invert-paths

   # Force push (WARNING: This rewrites history)
   git push --force
   ```

3. **Generate new credentials** and update your `.env` file

---

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.template` with placeholders
2. **Use Secret Manager for production** - Don't use environment variables in Cloud Run
3. **Rotate credentials regularly** - Change API keys every 90 days
4. **Use different credentials per environment** - Dev, staging, and prod should have separate keys
5. **Enable audit logging** - Track who accesses secrets
6. **Use least privilege** - Only grant necessary permissions
7. **Enable 2FA** - For all cloud accounts (GCP, LiveKit, OpenAI, etc.)

---

## Getting API Keys

### LiveKit
- Dashboard: https://cloud.livekit.io
- Navigate to: Settings → API Keys → Create Key

### OpenAI
- Dashboard: https://platform.openai.com
- Navigate to: API Keys → Create new secret key

### Cartesia
- Dashboard: https://cartesia.ai
- Navigate to: API Keys

### AssemblyAI
- Dashboard: https://www.assemblyai.com
- Navigate to: Account → API Keys

### Deepgram
- Dashboard: https://console.deepgram.com
- Navigate to: API Keys

### ElevenLabs
- Dashboard: https://elevenlabs.io
- Navigate to: Profile → API Keys

---

## Questions?

If you have security concerns or questions:
1. Check this SECURITY.md file
2. Review .env.template for required variables
3. Contact your team's security lead
4. Never share credentials via email, Slack, or other messaging platforms

---

## Summary

**DO:**
- Use .env.template as a reference
- Keep real credentials in .env (gitignored)
- Use environment variables for deployment
- Review changes before committing
- Revoke exposed credentials immediately

**DON'T:**
- Commit .env files
- Hardcode credentials in code
- Share credentials in chat/email
- Reuse credentials across environments
- Store credentials in plain text files that aren't gitignored
