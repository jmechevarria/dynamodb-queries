const db = require('./db');

exports.lambdaHandler = async (event) => {
  console.log(`EVENT = ${JSON.stringify(event)}`);

  try {
    if (event.offset) {
      try {
        event.offset = JSON.parse(Buffer.from(event.offset, 'base64').toString('ascii')) || undefined;
      } catch (error) {
        console.warn('Invalid offset, deleting it from input', error);
        delete event.offset;
      }
    }

    // find contacts
    const { contacts, LastEvaluatedKey: offset } = await db.getContacts(event);

    console.log(`Found ${contacts.length} contact(s)`);

    return { contacts, offset };
  } catch (error) {
    console.error(`Getting contact(s) for user email ${event.userEmail}`, error);

    if (error.code === 400) throw new Error(400);

    throw new Error(500);
  }
};
