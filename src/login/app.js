const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const manager = require('./manager');

const secretsPromise = manager.getSecret('JWT_SECRET');
// get JWT secret
let jwtSecret;

exports.lambdaHandler = async (event) => {
  const { email } = event;

  try {
    // find user in db
    const user = await db.findByEmail(email);

    console.warn('db user', JSON.stringify(user));

    if (!user) throw new Error('401 - Unauthorized');

    const { password } = user;

    const compare = bcrypt.compareSync(event.password, password);

    console.warn('compare', compare);

    if (!password || !compare) throw new Error('401 - Unauthorized');

    console.warn('db user', JSON.stringify(user));

    if (!jwtSecret) {
      jwtSecret = await secretsPromise;
    }

    console.warn('jwtSecret', JSON.stringify(jwtSecret));

    // generate Bearer token
    const token = jwt.sign({
      email,
    }, jwtSecret, {
      expiresIn: 1200,
    });

    console.log(`Logged in user with email ${email} and name ${user.name}`);

    return {
      token,
      user: {
        email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error('Logging user in', error);

    throw error;
  }
};
