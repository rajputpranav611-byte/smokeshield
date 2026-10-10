# AWS Security

## Principles
1. **Least Privilege**: Lambda functions only have access to resources they explicitly need (e.g., `ssm:GetParameter` for a specific ARN, and DynamoDB CRUD for the State Table).
2. **Secrets Management**: No secrets in source control. The `FIRMS_MAP_KEY` is decrypted at runtime using AWS SSM Parameter Store.
3. **API Access Control**: The `ApprovePlan` and state-mutating endpoints enforce basic role checks (e.g., `Principal` or `Admin`).
4. **Data Isolation**: DynamoDB table keys are prefixed with entity types to prevent data leakage across queries.
5. **No Public Mutators**: Mutation requires authorization.
