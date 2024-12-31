const admin = require('firebase-admin');
const serviceAccount = require('./bayleaf-e58ac-firebase-adminsdk-lrfxs-51d22713b7.json'); // Provide path to your Firebase service account file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
