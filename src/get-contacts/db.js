const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { CustomError } = require('./errors');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.getContacts = async ({
  userEmail, name, phone, limit, offset,
}) => {
  limit = parseInt(limit) || 20;

  if (limit > 100) limit = 100;

  let LastEvaluatedKey;

  try {
    LastEvaluatedKey = JSON.parse(Buffer.from(offset, 'base64').toString('ascii')) || undefined;
    if (!LastEvaluatedKey.user_email || !LastEvaluatedKey.composite_name_phone) LastEvaluatedKey = undefined;
  } catch (error) {
    console.error('Invalid offset', error);
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
        ProjectionExpression: '#name,phone,address_lines',
        Limit: limit - items.length,
      };

      if (name && phone) {
        params.KeyConditionExpression += ' AND composite_name_phone = :composite_name_phone';
        params.ExpressionAttributeValues[':composite_name_phone'] = `${name}::${phone}`;
      }

      // eslint-disable-next-line no-await-in-loop
      response = await ddbClient.send(new QueryCommand(params));
      const responseItems = response.Items;
      if (response?.$metadata.httpStatusCode === 200) {
        items.push(...responseItems);
      } else throw new CustomError('Error executing query', response?.$metadata.httpStatusCode, response);

      LastEvaluatedKey = response.LastEvaluatedKey;

      const lastItem = responseItems?.[responseItems.length - 1];

      if (!LastEvaluatedKey && lastItem) {
        LastEvaluatedKey = {
          user_email: userEmail,
          composite_name_phone: `${lastItem.name}::${lastItem.phone}`,
        };
      }
    } while (LastEvaluatedKey && items.length < limit);

    return { contacts: items, LastEvaluatedKey };
  } catch (error) {
    console.error(`Getting contacts for ${userEmail}`, error);

    throw error;
  }
};
