import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { OperationalPlan, PlanApproval, PlanVerification } from "../../types/domain";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

const TABLE_NAME = process.env.STATE_TABLE_NAME || "SmokeShieldState";

export class PlanRepository {
  
  async savePlan(plan: OperationalPlan): Promise<void> {
    // PK: SCHOOL#<schoolId>, SK: PLAN#<planId>#v<version>
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SCHOOL#${plan.schoolId}`,
        SK: `PLAN#${plan.id}#v${plan.version}`,
        EntityType: 'OperationalPlan',
        ...plan
      },
      ConditionExpression: "attribute_not_exists(PK)"
    }));
  }

  async getPlan(schoolId: string, planId: string, version: number): Promise<OperationalPlan | null> {
    const res = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `SCHOOL#${schoolId}`,
        SK: `PLAN#${planId}#v${version}`
      }
    }));
    return (res.Item as OperationalPlan) || null;
  }

  async saveApproval(approval: PlanApproval): Promise<void> {
    // PK: PLAN#<planId>, SK: APPROVAL#<timestamp>
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `PLAN#${approval.planId}`,
        SK: `APPROVAL#${approval.approvedAt}`,
        EntityType: 'PlanApproval',
        ...approval
      }
    }));
  }

  async saveVerification(verification: PlanVerification): Promise<void> {
    // PK: PLAN#<planId>, SK: VERIFICATION#<timestamp>
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `PLAN#${verification.planId}`,
        SK: `VERIFICATION#${verification.verifiedAt}`,
        EntityType: 'PlanVerification',
        ...verification
      }
    }));
  }
}
