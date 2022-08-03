const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

/**
 * Stores user item in table.
 *
 * @param {Object} data
 * @returns {Promise<string>}
 */
exports.saveUser = async ({ email, password, name }) => {
  try {
    return await ddbClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        email, password, name,
      },
      ConditionExpression: 'attribute_not_exists(email)',
    }));
  } catch (error) {
    console.error(`Signing up user with email ${email}`, error);

    throw error;
  }
};
