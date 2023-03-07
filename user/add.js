const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const db = require('../db_connect');
const { COGNITO } = require('../config');
const {
  sendResponse,
  sendErrorMessage,
  validateInput,
  isValidAuthToken,
  isUserAdmin,
  generateHash,
  generateSalt
} = require("../functions");

const cognito = new AWS.CognitoIdentityServiceProvider();

module.exports.handler = async (event) => {
  const require_fields = [
    'email',
    'password',
    'firstname',
    'lastname',
    'address',
    'postcode',
    'contactnumber'
  ];

  try {
    const { headers } = event;

    if (!isValidAuthToken(headers)) {
      return sendResponse(400, { message: 'Invalid token' });
    }

    if (!await isUserAdmin(headers)) {
      return sendResponse(401, { message: 'User not admin' });
    }

    if (!validateInput(event.body, require_fields)) {
      return sendResponse(400, { message: 'Invalid or missing input' });
    }
        
    const data = JSON.parse(event.body);
    const salt = generateSalt();
    const { hashed_password } = generateHash(data.password, salt);
    await addUserToPool({ ...data, password: hashed_password });
    await addUserIntoDB({ ...data, salt, password: hashed_password });

    return sendResponse(200, { message: `User registration successful for ${data.email}` });
  }
  catch (error) {
    console.log('error:', error);
    return sendErrorMessage(error);
  }
}

const addUserToPool = async (data) => {
  const { email, password } = data;
  const { user_pool_id } = COGNITO;
  const params = {
    UserPoolId: user_pool_id,
    Username: email,
    UserAttributes: [
      {
        Name: 'email',
        Value: email
      },
      {
        Name: 'email_verified',
        Value: 'true'
      }],
      MessageAction: 'SUPPRESS'
  };
 
  const response = await cognito.adminCreateUser(params).promise();
  if (response.User) {
    const paramsForSetPass = {
      Password: password,
      UserPoolId: user_pool_id,
      Username: email,
      Permanent: true
    };
    await cognito.adminSetUserPassword(paramsForSetPass).promise();
  }
}

const addUserIntoDB = async (data) => {
  const sql_query = `INSERT INTO USER VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DEFAULT, DEFAULT, DEFAULT)`;
    
  const {
    firstname,
	  lastname,
    address,
	  postcode,
	  contactnumber,
	  email,
	  password,
    salt
  } = data;
  const user_id = uuidv4();

  await db.query(sql_query, [
    user_id,
    firstname.trim(),
    lastname.trim(),
    address.trim(),
    postcode.trim(),
    contactnumber.trim(),
    email.trim(),
    email.trim(),
    password,
    salt
  ]);
  await db.end();
}

