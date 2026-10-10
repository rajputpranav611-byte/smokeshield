# AWS Costs

## Cost Control Strategy
SmokeShield uses on-demand AWS serverless resources to stay heavily within Free Tier limits.

### Included Services
1. **API Gateway HTTP API**: Billed per million requests. Very inexpensive for small schools.
2. **Lambda**: Billed per GB-second. Arm64 provides better price/performance. Memory size (512MB) and timeouts are constrained.
3. **DynamoDB**: `PAY_PER_REQUEST` billing mode avoids hourly costs.
4. **EventBridge Scheduler**: Low monthly cost for a single daily trigger per plan.
5. **SSM Parameter Store**: Standard parameters are free.
6. **CloudWatch Logs**: Bound retention to 7 days to prevent runaway storage costs.

### Total Expected Cost
Development use with mocked/low-traffic data should cost **less than $1/month**, fitting entirely within the Free Tier.
