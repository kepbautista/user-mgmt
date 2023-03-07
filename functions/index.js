const crypto = require('crypto');
const jwt_decode = require('jwt-decode');
const { isAdminEmail } = require('../functions/database')

const sendResponse = (statusCode, body) => {
  const response = {
      statusCode: statusCode,
      body: JSON.stringify(body),
      headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
      }
  }
  return response
}

const sendErrorMessage = (error) => {
  const message = error.message ? error.message : 'Internal server error';
  const statusCode = error.statusCode ? error.statusCode : 500;
  return sendResponse(statusCode, { message });
}

const validateInput = (data, required_fields) => {
  const body = JSON.parse(data);
  console.log('body: ', body);
  
  for (let field of required_fields) {
    if (!body[field] || body[field].trim() === '') {
      return false;
    }

    if (field === 'password' & body[field].length < 6 && body[field].indexOf(' ') >= 0) {
      return false;
    }
  }

  return true
}

const isValidAuthToken = (headers) => {
  if (headers && headers.Authorization) {
    try {
      const token = headers.Authorization.replace('Bearer ', '');
      const decoded = jwt_decode(token);

      if(Date.now() <= decoded.exp) { // token is expired
        return false;
      }
      return true;
    }
    catch(error) {
      console.log('error: ', error);
      return false;
    }
  }
  return false;
}

const isUserAdmin = async (headers) => {
  if (headers && headers.Authorization) {
    try {
      const token = headers.Authorization.replace('Bearer ', '');
      const decoded = jwt_decode(token);
      const isAdmin = await isAdminEmail(decoded.email);

      if (isAdmin) {
        return true;
      }

      return false;
    }
    catch(error) {
      console.log('error: ', error);
      return false;
    }
  }
  return false;
}

const generateSalt = () => {
  return crypto.randomBytes(Math.floor(Math.random() * (15) + 1)).toString('hex');
}

const generateHash = (password, salt) => {
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  const value = hash.digest('hex');
  return {
    salt,
    hashed_password: value.toString().substring(0, 100)
  }
}

module.exports = {
  sendResponse,
  sendErrorMessage: sendErrorMessage,
  validateInput,
  isUserAdmin,
  isValidAuthToken,
  generateSalt,
  generateHash
};