const app = require('express');

const {addAddress, getAddresses, updateAddress, deleteAddress} = require('../controllers/address.controller');
const {authenticateToken} = require('../middleware/auth.middleware');
const {authorizeRoles} = require('../middleware/auth.middleware');
const router = app.Router();

router.use(authenticateToken, authorizeRoles('customer'));

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

module.exports = router;