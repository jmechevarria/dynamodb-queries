const { CustomError } = require('./errors');
const db = require('./db');

exports.lambdaHandler = async (event) => {
  console.log(`EVENT = ${JSON.stringify(event)}`);

  try {
    // delete contact
    const response = await db.deleteContact(event);

    console.warn(response);
    if (response?.$metadata.httpStatusCode === 200) {
      if (response.Attributes) {
        console.log(`Deleted contact ${event.name} with phone ${event.phone}`);

        return true;
      } throw new CustomError('Not found', 404, `No contact found for name ${event.name} and phone ${event.phone}`);
    }

    console.error('Failed to delete contact', JSON.stringify(response));

    throw new Error();
  } catch (error) {
    console.error('Deleting contact', error);

    if (error.code === 404) throw new Error(404);

    throw new Error('500');
  }
};
