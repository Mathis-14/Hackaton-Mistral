#!/bin/bash
# Fix Amplify 404: configure platform WEB_COMPUTE + framework Next.js - SSR
# Run from CloudShell (aws cli pre-installed) or after: brew install awscli && aws configure
# WARNING: Do NOT add --environment-variables here: it REPLACES all vars (would remove MISTRAL_API_KEY etc).

set -e
APP_ID="d1t02aio82ghmg"
BRANCH="main"
REGION="eu-north-1"

echo "Setting platform to WEB_COMPUTE..."
aws amplify update-app --app-id "$APP_ID" --platform WEB_COMPUTE --region "$REGION"

echo "Setting branch framework to Next.js - SSR..."
aws amplify update-branch --app-id "$APP_ID" --branch-name "$BRANCH" --framework "Next.js - SSR" --region "$REGION"

echo "Done. Add AMPLIFY_MONOREPO_APP_ROOT=Distral_AI in Console > Hosting > Environment variables."
echo "Add a Service role in App settings > IAM roles. Then trigger a new deploy."
