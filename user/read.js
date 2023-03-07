const db = require('../db_connect');
const {
  isUserAdmin,
  isValidAuthToken,
  sendResponse,
  sendErrorMessage
} = require('../functions');


module.exports.readOne = async (event) => {
  const { queryStringParameters, headers } = event;

  if (!isValidAuthToken(headers)) {
    return sendResponse(400, { message: 'Invalid token' });
  }

  if (!await isUserAdmin(headers)) {
    return sendResponse(401, { message: 'User not admin' });
  }

  if (!queryStringParameters || !queryStringParameters.id) {
    return sendResponse(400, { message: 'Invalid input' });
  }

  const sql_query =
    `SELECT
    id, firstname, lastname, address, postcode, contactnumber, email
    FROM USER WHERE id=? AND is_deleted=0
    LIMIT 1`;

  try {
    const result = await db.query(sql_query, [queryStringParameters.id]);
    await db.end();

    // user not found
    if (result.length === 0) {
      return sendResponse(404, { message: 'User not found' });
    }

    return sendResponse(200, { user: result[0] } );
  }
  catch(error) {
    return sendErrorMessage(error);
  }
}

module.exports.readAll = async (event) => {
  const { headers } = event;

  if (!isValidAuthToken(headers)) {
    return sendResponse(400, { message: 'Invalid token' });
  }

  if (!await isUserAdmin(headers)) {
    return sendResponse(401, { message: 'User not admin' });
  }

  const sql_query =
    `SELECT
    id, firstname, lastname, address, postcode, contactnumber, email
    FROM USER WHERE is_deleted=0`;

  try {
    const rows = await db.query(sql_query);
    await db.end();

    if (rows.length > 0) {
      return sendResponse(200, { users: rows } );
    }

    return sendResponse(404, { message: 'No users yet' });
  }
  catch(error) {
    return sendErrorMessage(error);
  }
}
