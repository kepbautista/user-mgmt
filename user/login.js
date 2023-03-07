const AWS = require('aws-sdk');

const { COGNITO } = require('../config');
const { getUserSaltByEmail } = require('../functions/database');
const {
  generateHash,
  sendResponse,
  sendErrorMessage,
  validateInput
} = require("../functions");

const cognito = new AWS.CognitoIdentityServiceProvider();

module.exports.handler = async (event) => {
  try {
    if (!validateInput(event.body, ['email', 'password'])) {
      return sendResponse(400, { message: 'Missing email or password input' });
    }

    const { email, password } = JSON.parse(event.body);
    const { salt } = await getUserSaltByEmail(email);
    const { hashed_password } = generateHash(password, salt);
    const { user_pool_id, client_id } = COGNITO;
    const params = {
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      UserPoolId: user_pool_id,
      ClientId: client_id,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: hashed_password
      }
    };
    const response = await cognito.adminInitiateAuth(params).promise();
    return sendResponse(200, { message: 'Success', token: response.AuthenticationResult.IdToken });
  }
  catch (error) {
    return sendErrorMessage(error);
  }
}