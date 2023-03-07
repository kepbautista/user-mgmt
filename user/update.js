const AWS = require('aws-sdk');

const db = require('../db_connect');
const { COGNITO } = require('../config');
const {
  isUserAdmin,
  isValidAuthToken,
  sendResponse,
  sendErrorMessage,
  generateHash,
  generateSalt,
  validateInput
} = require('../functions');
const { getUserById } = require('../functions/database');

const cognito = new AWS.CognitoIdentityServiceProvider();

module.exports.updateUser = async (event) => {
  const { headers } = event;
  const require_fields = [
    'id',
    'firstname',
    'lastname',
    'address',
    'postcode',
    'contactnumber'
  ];

  if (!isValidAuthToken(headers)) {
    return sendResponse(400, { message: 'Invalid token' });
  }

  if (!await isUserAdmin(headers)) {
    return sendResponse(401, { message: 'User not admin' });
  }

  if (!validateInput(event.body, require_fields)) {
    return sendResponse(400, { message: 'Invalid input' });
  }

  try {
    const sql_query = `
      UPDATE USER
      SET firstname=?, lastname=?, address=?, postcode=?, contactnumber=?,
      date_updated=CURRENT_TIMESTAMP()
      WHERE id=? AND is_deleted=0`;
    const {
      firstname,
      lastname,
      address,
      postcode,
      contactnumber,
      id
    } = JSON.parse(event.body);

    const result = await db.query(sql_query, [firstname,
      lastname,
      address,
      postcode,
      contactnumber,
      id
    ]);
    await db.end();

    // user is not found
    if (result.affectedRows === 0) {
      return sendResponse(404, { message: 'User not found' });
    }

    return sendResponse(200, { message: 'User info successfully updated' });
  }
  catch (error) {
    console.log('error:', error);
    return sendErrorMessage(error);
  }
}

module.exports.changePassword = async (event) => {
  const { body, headers } = event;
  const { id } = JSON.parse(body);

  if (!isValidAuthToken(headers)) {
    return sendResponse(400, { message: 'Invalid token' });
  }

  if (!await isUserAdmin(headers)) {
    return sendResponse(401, { message: 'User not admin' });
  }

  if (!id || !validateInput(body, ['id', 'password'])) {
    return sendResponse(400, { message: 'Invalid input' });
  }

  try {
    const sql_query = `
      UPDATE USER
      SET password=?, salt=?, date_updated=CURRENT_TIMESTAMP()
      WHERE id=? AND is_deleted=0`;

    const data = JSON.parse(body);
    const salt = generateSalt();
    const { hashed_password } = generateHash(data.password, salt);

    const result = await db.query(sql_query, [hashed_password, salt, id]);
    await db.end();

    // user id not found
    if (result.affectedRows === 0) {
      return sendResponse(404, { message: 'User not found' });
    }
    
    // change password in cognito
    const { email } = await getUserById(id);
    await changePasswordInUserPool(email, hashed_password);

    return sendResponse(200, { message: 'Password change successful' });
  }
  catch (error) {
    console.log('error:', error);
    return sendErrorMessage(error);
  } 
}

const changePasswordInUserPool = async (email, password) => {
  const { user_pool_id } = COGNITO;
  const params = {
    Password: password,
    UserPoolId: user_pool_id,
    Username: email,
    Permanent: true
  };
  await cognito.adminSetUserPassword(params).promise();
}
