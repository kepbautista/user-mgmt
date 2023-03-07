const db = require('../db_connect');

module.exports.getUserById = async (id) => {
  const sql_query = 'SELECT * FROM USER WHERE id=? LIMIT 1';

  const result = await db.query(sql_query, [id]);
  await db.end();

  if (result.length > 0) {
    return result[0];
  }

  return null;
}

module.exports.getUserSaltByEmail = async (email) => {
  const sql_query = 'SELECT salt FROM USER WHERE email=? LIMIT 1';

  const result = await db.query(sql_query, [email]);
  await db.end();

  if (result.length > 0) {
    return result[0];
  }

  return null;
}

module.exports.getUserByIdList = async (id_list_string) => {
  const sql_query = `SELECT * FROM USER WHERE id IN (${id_list_string})`;

  const result = await db.query(sql_query);
  await db.end();

  if (result.length > 0) {
    return Object.values(JSON.parse(JSON.stringify(result)));
  }

  return null;
}

module.exports.isAdminEmail = async (email) => {
  const sql_query = 'SELECT user_id FROM ADMIN_USER WHERE username=? LIMIT 1';

  const result = await db.query(sql_query, [email]);
  await db.end();

  if (result.length > 0) {
    return true
  }

  return false;
}

