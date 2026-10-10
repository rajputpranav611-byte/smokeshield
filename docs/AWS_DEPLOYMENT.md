# AWS Deployment Guide

## Prerequisites
1. Ensure AWS CLI and SAM CLI are configured.
2. Ensure you have an appropriate, least-privilege IAM identity. Do not use the `root` user for deployment.
3. The codebase contains a local `.npmrc` setting `legacy-peer-deps=true` due to upstream dependency conflicts, and requires `esbuild` installed.

## Deployment Steps
1. Run `sam build --template-file template.yaml`
2. Run `sam deploy --guided`
3. Enter stack name, select AWS region, and accept IAM role creation.
4. Manually configure the SSM Parameter `/smokeshield/{env}/FIRMS_MAP_KEY` via AWS Console or CLI using `SecureString`.

## EventBridge Schedule
The PlanGuard schedule `SmokeShieldPlanGuardMorning` is created in a `DISABLED` state. After deployment, test manually and then enable the rule from the AWS Console.
