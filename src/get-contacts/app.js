const db = require('./db');

exports.lambdaHandler = async (event) => {
  console.log(`EVENT = ${JSON.stringify(event)}`);

  try {
    const { contacts, LastEvaluatedKey } = await db.getContacts(event);

    console.log(`Found ${contacts.length} contact(s)`);

    const offset = LastEvaluatedKey ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64') : undefined;

    return { contacts, offset };
  } catch (error) {
    console.error(`Getting contact(s) for user email ${event.userEmail}`, error);

    if (error.code === 400) throw new Error(400);

    throw new Error(500);
  }
};
