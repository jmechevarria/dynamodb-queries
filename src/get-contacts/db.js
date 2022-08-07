const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { QueryCommand, ExecuteStatementCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.getContacts = ({
  userEmail, phone, name, limit, offset,
}) => {
  try {
    limit = parseInt(limit) || 20;
    const params = {
      // Statement: `SELECT * FROM "dynamodb-queries-ContactTable-3DUEW8MLA2TG" WHERE "user_email" = 'interview2@email.com'`,
      // ExecuteStatementCommand: 'SELECT * FROM "' + process.env.TABLE_NAME + '" WHERE "user_email" = \'interview@email.com\' AND "composite_name_phone" = \'name::phone\'',
      Statement: `SELECT * FROM "${process.env.TABLE_NAME}" WHERE "user_email" = ?`,
      Parameters: [userEmail],
      Limit: limit < 100 ? limit : 100,
      // NextToken: offset ? JSON.parse(offset) : undefined,

      // TableName: process.env.TABLE_NAME,
      // KeyConditionExpression: 'user_email = :userEmail',
      // ExpressionAttributeValues: { ':userEmail': userEmail },
      // Limit: parseInt(limit) || 20,
      ExclusiveStartKey: offset ? JSON.parse(offset) : undefined,
    };

    if (limit === '1') {
      params.Statement += ' AND "composite_name_phone" = ?';
      params.Parameters.push(`${name}::${phone}`);
    } else if (name) {
      params.Statement += ' AND ';
      params.Statement += '(contains(composite_name_phone, ?)';
      params.Parameters.push(name);

      if (phone) {
        params.Statement += ' OR contains(composite_name_phone, ?))';
        params.Parameters.push(phone);
      } else params.Statement += ')';
    } else if (phone) {
      params.Statement += ' AND (contains(composite_name_phone, ?))';
      params.Parameters.push(phone);
    }

    console.log(params);

    // if (name && phone) {
    //   params.KeyConditionExpression += ' AND begins_with(phone, :phone)';
    //   params.ExpressionAttributeValues[':name'] = name;
    //   params.ExpressionAttributeValues[':phone'] = phone;
    //   params.ExpressionAttributeNames = { '#name': 'name' };
    //   params.FilterExpression = 'begins_with(#name, :name)';
    // } else if (name) {
    //   params.IndexName = 'name_index';
    //   params.KeyConditionExpression += ' AND begins_with(#name, :name)';
    //   params.ExpressionAttributeValues[':name'] = name;
    //   params.ExpressionAttributeNames = { '#name': 'name' };
    // } else if (phone) {
    //   params.KeyConditionExpression += ' AND begins_with(phone, :phone)';
    //   params.ExpressionAttributeValues[':phone'] = phone;
    // }

    return ddbClient.send(new ExecuteStatementCommand(params));
    // return ddbClient.send(new QueryCommand(params));
  } catch (error) {
    console.error(`Getting contacts for ${userEmail}`, error);

    throw error;
  }
};
