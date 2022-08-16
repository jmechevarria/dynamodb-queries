const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { CustomError } = require('./errors');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.getContacts = async ({
  userEmail, limit, offset, name, phone, // forward,
}) => {
  // forward = forward !== 'false';
  limit = parseInt(limit) || 20;

  if (limit > 100) limit = 100;

  let LastEvaluatedKey;

  try {
    LastEvaluatedKey = JSON.parse(Buffer.from(offset, 'base64').toString('ascii')) || undefined;
    if (!LastEvaluatedKey.user_email || !LastEvaluatedKey.composite_name_phone) LastEvaluatedKey = undefined;
  } catch (error) {
    console.warn('Invalid offset', error);
    LastEvaluatedKey = undefined;
  }

  try {
    const items = [];
    let response;

    do {
      const params = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'user_email = :userEmail',
        ExpressionAttributeValues: { ':userEmail': userEmail },
        ExpressionAttributeNames: { '#name': 'name' },
        ExclusiveStartKey: LastEvaluatedKey,
        // ScanIndexForward: forward,
        ProjectionExpression: '#name,phone,address_lines',
        Limit: limit - items.length,
      };

      if (name && phone) {
        params.KeyConditionExpression += ' AND composite_name_phone = :composite_name_phone';
        params.ExpressionAttributeValues[':composite_name_phone'] = `${name}::${phone}`;
      }

      console.warn('params', params);
      // eslint-disable-next-line no-await-in-loop
      response = await ddbClient.send(new QueryCommand(params));

      if (response?.$metadata.httpStatusCode === 200) {
        items.push(...response.Items);
      } else throw new CustomError('Error executing query', response?.$metadata.httpStatusCode, response);

      LastEvaluatedKey = response.LastEvaluatedKey;

      console.warn(response);
    } while (LastEvaluatedKey && items.length < limit);

    return { contacts: items, LastEvaluatedKey };
  } catch (error) {
    console.error(`Getting contacts for ${userEmail}`, error);

    throw error;
  }
};
