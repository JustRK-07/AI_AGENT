# Quick Start Guide - GCP Deployment

Deploy your AI Voice Agent system to Google Cloud Platform in under 30 minutes.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed: [Installation Guide](https://cloud.google.com/sdk/docs/install)
3. **API Keys** ready:
   - OpenAI API Key
   - LiveKit credentials (URL, API Key, API Secret)
   - Twilio credentials (Account SID, Auth Token, Phone Number)

## Step 1: Configure Your Environment

Create a configuration file with your credentials:

```bash
cat > gcp-config.sh << 'EOF'
#!/bin/bash

# GCP Configuration
export PROJECT_ID="voice-agent-prod"  # Change this to your project ID
export REGION="us-central1"

# Database Configuration
export DB_INSTANCE_NAME="voiceagent-db"
export DB_NAME="voiceagent"
export DB_USER="voiceagent"
export DB_PASSWORD="YOUR_SECURE_PASSWORD_HERE"  # Generate a strong password!

# JWT Secret (generate with: openssl rand -base64 32)
export JWT_SECRET="YOUR_JWT_SECRET_HERE"

# LiveKit Configuration
export LIVEKIT_URL="wss://your-livekit-server.livekit.cloud"
export LIVEKIT_API_KEY="APIxxxxxxxxxxxxxxxxx"
export LIVEKIT_API_SECRET="your-livekit-api-secret"

# Twilio Configuration
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="your-twilio-auth-token"
export TWILIO_PHONE_NUMBER="+1234567890"

# OpenAI Configuration
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Optional: Other LLM Providers
export CEREBRAS_API_KEY=""
export GROQ_API_KEY=""
export GOOGLE_AI_API_KEY=""
EOF

chmod +x gcp-config.sh
```

**IMPORTANT**: Edit `gcp-config.sh` and replace all placeholder values!

## Step 2: Generate Secure Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Database Password
openssl rand -base64 24

# Copy these values into your gcp-config.sh file
```

## Step 3: Authenticate with GCP

```bash
# Login to Google Cloud
gcloud auth login

# Set up application default credentials
gcloud auth application-default login
```

## Step 4: Deploy Everything

Run the automated deployment script:

```bash
./deploy.sh
```

This script will:
- ✅ Create and configure your GCP project
- ✅ Set up Cloud SQL PostgreSQL database
- ✅ Store secrets in Secret Manager
- ✅ Build Docker containers for backend and frontend
- ✅ Deploy to Cloud Run
- ✅ Run database migrations
- ✅ Configure all necessary permissions

**Duration**: ~15-20 minutes

## Step 5: Access Your Application

After deployment completes, you'll see:

```
Service URLs:
  Frontend: https://voice-agent-frontend-xxxxx.run.app
  Backend:  https://voice-agent-backend-xxxxx.run.app
```

1. **Open the frontend URL** in your browser
2. **Create your first user account** (first user becomes admin)
3. **Create an agent** with your desired configuration

## Step 6: Configure Twilio

Connect your Twilio phone number to the backend:

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: **Phone Numbers → Manage → Active Numbers**
3. Click on your phone number
4. Under **Voice Configuration**:
   - **A CALL COMES IN**: Webhook
   - **URL**: `https://voice-agent-backend-xxxxx.run.app/api/v1/calls/webhook`
   - **HTTP Method**: POST
5. Click **Save**

## Step 7: Test Your Voice Agent

Call your Twilio phone number and test the voice agent!

---

## Monitoring and Logs

### View Real-time Logs

```bash
# Backend logs
gcloud alpha run services logs tail voice-agent-backend --region=us-central1

# Frontend logs
gcloud alpha run services logs tail voice-agent-frontend --region=us-central1
```

### Access Google Cloud Console

- **Cloud Run Services**: https://console.cloud.google.com/run
- **Cloud SQL**: https://console.cloud.google.com/sql
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager
- **Cloud Build History**: https://console.cloud.google.com/cloud-build/builds

---

## Common Issues

### Issue: "Permission denied" errors

**Solution**: Run authentication again:
```bash
gcloud auth login
gcloud auth application-default login
```

### Issue: Cloud Build fails

**Solution**: Check build logs:
```bash
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

### Issue: Database connection errors

**Solution**: Verify Cloud SQL instance is running:
```bash
gcloud sql instances list
gcloud sql instances describe voiceagent-db
```

### Issue: Frontend can't connect to backend

**Solution**: Update CORS settings:
```bash
# Get frontend URL
FRONTEND_URL=$(gcloud run services describe voice-agent-frontend --region=us-central1 --format="value(status.url)")

# Update backend CORS
gcloud run services update voice-agent-backend \
  --region=us-central1 \
  --set-env-vars="CORS_ORIGIN=${FRONTEND_URL}"
```

---

## Update Deployment

To deploy changes after modifying code:

```bash
# Load your configuration
source gcp-config.sh

# Submit new build
gcloud builds submit --config=cloudbuild.yaml
```

Or use the deploy script again:
```bash
./deploy.sh
```

---

## Costs

Estimated monthly costs for light usage:

- **Cloud Run Backend**: $20-50/month
- **Cloud Run Frontend**: $10-30/month
- **Cloud SQL (db-f1-micro)**: $15-30/month
- **Secret Manager**: $0.50/month
- **Cloud Build**: Free tier (120 build-minutes/day)

**Total**: ~$45-110/month

For production with higher traffic, upgrade Cloud SQL tier and adjust Cloud Run min instances.

---

## Next Steps

1. **Configure Custom Domain**: See [DEPLOYMENT.md](DEPLOYMENT.md#custom-domain-configuration)
2. **Set Up Monitoring**: Add uptime checks and alerts
3. **Enable Backups**: Configure Cloud SQL automated backups
4. **Add More Agents**: Create specialized agents for different use cases
5. **Test LLM Providers**: Try Cerebras, Groq, or other providers

---

## Support Resources

- **Full Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Google Cloud Docs**: https://cloud.google.com/docs
- **LiveKit Docs**: https://docs.livekit.io
- **Troubleshooting**: See DEPLOYMENT.md#troubleshooting section

---

**🎉 Congratulations!** Your AI Voice Agent is now running on Google Cloud Platform.
