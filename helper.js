const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const secretKey='fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43';

function encrypt(text) {
  const cipher = crypto.createCipher(algorithm, secretKey);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text) {
  const decipher = crypto.createDecipher(algorithm, secretKey);
  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}


module.exports = {
  generateHashPassword : async (password) => {
  	const hash = await encrypt(password);
    return hash;
  },
  comparePassword :  (login_password,orignal_password) => {
  	const decryptedPassword = decrypt(orignal_password);
    return login_password == decryptedPassword;
  },
}
