const db = require('./db');
const { CustomError } = require('./errors');

exports.lambdaHandler = async (event) => {
  console.log(`EVENT = ${JSON.stringify(event)}`);

  try {
    if (event.offset) {
      try {
        event.offset = Buffer.from(event.offset, 'base64').toString('ascii');
      } catch (error) {
        console.warn('Invalid offset, deleting it from input', error);
        delete event.offset;
      }
    }

    // find contacts
    const response = await db.getContacts(event);

    if (response?.$metadata.httpStatusCode === 200) {
      const contacts = response.Items;

      console.log(`Found ${contacts.length} contact(s)`);

      return { contacts, offset: response.LastEvaluatedKey };
    }
  } catch (error) {
    console.error(`Getting contact(s) for user email ${event.userEmail}`, error);

    if (error instanceof CustomError) throw error;

    throw new Error('500');
  }
};
