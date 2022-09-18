const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

/**
 * Deletes contact item from table.
 *
 * @param {Object} data
 * @returns {Promise<void>}
 */
exports.deleteContact = ({
  userEmail, name, phone,
}) => ddbClient.send(new DeleteCommand({
  TableName: process.env.TABLE_NAME,
  Key: { user_email: userEmail, composite_name_phone: `${name}::${phone}` },
  ReturnValues: 'ALL_OLD',
}));
