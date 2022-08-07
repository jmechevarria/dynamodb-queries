const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const manager = require('./manager');

const secretsPromise = manager.getSecret('JWT_SECRET');
// get JWT secret
let jwtSecret;

exports.lambdaHandler = async (event) => {
  try {
    // insert new user with hashed password
    const response = await db.saveUser({ ...event, password: bcrypt.hashSync(event.password, bcrypt.genSaltSync()) });

    if (response?.$metadata.httpStatusCode === 200) {
      const { email } = event;

      console.log(`Created user with email ${email}`);

      if (!jwtSecret) {
        jwtSecret = await secretsPromise;
      }

      // generate Bearer token
      const token = jwt.sign({
        email,
      }, jwtSecret, {
        expiresIn: 1200,
      });

      return {
        token,
        user: {
          email,
          name: event.name,
        },
      };
    }

    console.error('Failed to create user', JSON.stringify(response));

    throw new Error('500:Unexpected error: user not created');
  } catch (error) {
    console.error('Signing user up', error);
    console.warn('name', error.name);
    if (error?.name === 'ConditionalCheckFailedException') throw new Error('400');

    throw error;
  }
};
