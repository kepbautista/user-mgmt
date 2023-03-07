const AWS = require('aws-sdk');

const db = require('../db_connect');
const { COGNITO } = require('../config');
const { getUserById, getUserByIdList } = require('../functions/database');
const { isValidAuthToken, isUserAdmin, sendResponse, sendErrorMessage } = require("../functions");

const cognito = new AWS.CognitoIdentityServiceProvider();


module.exports.deleteOne = async (event) => {
  const { headers } = event;
  const { id } = JSON.parse(event.body);

  if (!isValidAuthToken(headers)) {
    return sendResponse(400, { message: 'Invalid token' });
  }

  if (!await isUserAdmin(headers)) {
    return sendResponse(401, { message: 'User not admin' });
  }

  if (!id) {
    return sendResponse(400, { message: 'Invalid input' });
  }

  const sql_query = `
    UPDATE USER
    SET is_deleted=1, date_updated=CURRENT_TIMESTAMP()
    WHERE id=? AND is_deleted=0`;

  try {
    const result = await db.query(sql_query, [id]);
    await db.end();

    // user id not found
    if (result.affectedRows === 0) {
      return sendResponse(404, { message: 'User not found' });
    }

    // remove user from UserPool
    const { email } = await getUserById(id);
    await removeUserFromPool(email);

    return sendResponse(200, { message: 'User is deleted' } );
  }
  catch(error) {
    return sendErrorMessage(error);
  }
}

module.exports.deleteMultiple = async (event) => {
  const { headers } = event;
  const { ids } = JSON.parse(event.body);
  
  if (!isValidAuthToken(headers)) {
    return sendResponse(400, { message: 'Invalid token' });
  }

  if (!await isUserAdmin(headers)) {
    return sendResponse(401, { message: 'User not admin' });
  }

  if (!ids || !Array.isArray(ids)) {
    return sendResponse(400, { message: 'Invalid input' });
  }


  try {
    const id_list = ids.map(id => `"${id}"`).join(', ');
    const sql_query = `
      UPDATE USER
      SET is_deleted=1, date_updated=CURRENT_TIMESTAMP()
      WHERE id IN (${id_list}) AND is_deleted=0`;
    const result = await db.query(sql_query);
    await db.end();

    if (result.affectedRows === 0) {
      return sendResponse(404, { message: 'None of the users were found' });
    }

    // remove deleted users from UserPool
    const user_list = await getUserByIdList(id_list);
    user_list.forEach(async (item) => {
      await removeUserFromPool(item.email);
    });

    return sendResponse(200, { message: 'Users are deleted' } );
  }
  catch(error) {
    return sendErrorMessage(error);
  }
}

const removeUserFromPool = async (email) => {
  const { user_pool_id } = COGNITO;
  const params = {
    UserPoolId: user_pool_id,
    Username: email
  };
  await cognito.adminDeleteUser(params).promise();
}
