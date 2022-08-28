const db = require('./db');

exports.lambdaHandler = async (event) => {
  console.log(`EVENT = ${JSON.stringify(event)}`);

  try {
    // delete contact
    const response = await db.deleteContact(event);

    console.warn(response);
    if (response?.$metadata.httpStatusCode === 200) {
      console.log(`Deleted contact ${event.name} with phone ${event.phone}`);

      return true;
    }

    console.error('Failed to delete contact', JSON.stringify(response));

    throw new Error();
  } catch (error) {
    console.error('Deleting contact', error);

    if (error?.name === 'ConditionalCheckFailedException') throw new Error('409:Contact already registered');

    throw new Error('500');
  }
};
