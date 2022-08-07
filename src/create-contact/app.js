const db = require('./db');

exports.lambdaHandler = async (event) => {
  console.log(`EVENT = ${JSON.stringify(event)}`);

  try {
    if (!Array.isArray(event.addressLines)) delete event.addressLines;

    // create contact
    const response = await db.saveContact(event);

    if (response?.$metadata.httpStatusCode === 200) {
      console.log(`Created contact ${event.name}`);

      return { contact: event };
    }

    console.error('Failed to create contact', JSON.stringify(response));

    throw new Error();
  } catch (error) {
    console.error('Creating contact', error);
    console.warn('name', error.name);
    if (error?.name === 'ConditionalCheckFailedException') throw new Error('409:Contact already registered');

    throw new Error('500');
  }
};
