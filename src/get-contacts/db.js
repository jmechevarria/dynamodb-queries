const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { CustomError } = require('./errors');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.getContacts = async ({
  userEmail,
  phone,
  name,
  limit,
  offset,
}) => {
  const items = [];
  let response;
  let LastEvaluatedKey = offset;

  try {
    limit = parseInt(limit) || 20;
    do {
      const params = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'user_email = :userEmail',
        ExpressionAttributeValues: { ':userEmail': userEmail },
        ExclusiveStartKey: LastEvaluatedKey,
      };

      if (name && phone) {
        params.ExpressionAttributeValues[':name'] = name;
        params.ExpressionAttributeValues[':phone'] = phone;
        params.ExpressionAttributeNames = { '#name': 'name' };
        params.FilterExpression = '(contains(phone, :phone) OR phone=:phone) AND (contains(#name, :name) OR #name=:name)';
      } else if (name) {
        params.ExpressionAttributeValues[':name'] = name;
        params.ExpressionAttributeNames = { '#name': 'name' };
        params.FilterExpression = '(contains(#name, :name) OR #name=:name)';
      } else if (phone) {
        params.ExpressionAttributeValues[':phone'] = phone;
        params.FilterExpression = '(contains(#phone, :phone) OR #phone=:phone)';
      }

      console.log(params);

      // eslint-disable-next-line no-await-in-loop
      response = await ddbClient.send(new QueryCommand(params));

      if (response?.$metadata.httpStatusCode === 200) {
        items.push(...response.Items);
      } else throw new CustomError('Error executing query', response?.$metadata.httpStatusCode, response);

      LastEvaluatedKey = response.LastEvaluatedKey;
      console.warn(response);
    } while (LastEvaluatedKey && items.length < limit);

    if (items.length >= limit) {
      items.splice(limit);
      const last = items[items.length - 1];
      LastEvaluatedKey = Buffer.from(JSON.stringify({
        user_email: last.user_email,
        composite_name_phone: last.composite_name_phone,
      })).toString('base64');
    }

    return { contacts: items, LastEvaluatedKey };
  } catch (error) {
    console.error(`Getting contacts for ${userEmail}`, error);

    throw error;
  }
};
