import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

let cachedFirmsMapKey: string | null = null;
const ssmClient = new SSMClient({});

export async function getFirmsMapKey(): Promise<string | null> {
  if (cachedFirmsMapKey !== null) {
    return cachedFirmsMapKey;
  }

  const envStr = String(process.env.NODE_ENV);
  if (process.env.FIRMS_MAP_KEY && envStr !== 'production' && envStr !== 'dev') {
    return process.env.FIRMS_MAP_KEY;
  }

  const environment = process.env.NODE_ENV || 'dev';
  const paramName = `/smokeshield/${environment}/FIRMS_MAP_KEY`;

  try {
    const command = new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    });
    const response = await ssmClient.send(command);
    if (response.Parameter?.Value) {
      cachedFirmsMapKey = response.Parameter.Value;
      return cachedFirmsMapKey;
    }
  } catch (_error) {
    console.warn(`Failed to fetch FIRMS_MAP_KEY from SSM: ${paramName}`);
  }

  return null;
}
