const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

/**
 * Finds user by email.
 *
 * @param {string} email
 * @returns {Promise<string>}
 */
exports.findByEmail = async (email) => {
  try {
    const { Item } = await ddbClient.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        email,
      }),
    }));

    if (Item) return unmarshall(Item);
  } catch (error) {
    console.error(`Searching user by email ${email}`, error);

    throw error;
  }
};
