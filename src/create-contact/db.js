const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

/**
 * Stores contact item in table.
 *
 * @param {Object} data
 * @returns {Promise<void>}
 */
exports.saveContact = ({
  userEmail, name, phone, addressLines,
}) => ddbClient.send(new PutCommand({
  TableName: process.env.TABLE_NAME,
  Item: {
    user_email: userEmail, composite_name_phone: `${name}::${phone}`, name, phone, address_lines: addressLines,
  },
  ExpressionAttributeValues: { ':userEmail': userEmail, ':composite_name_phone': `${name}::${phone}` },
  ConditionExpression: 'user_email <> :userEmail AND composite_name_phone <> :composite_name_phone',
}));
