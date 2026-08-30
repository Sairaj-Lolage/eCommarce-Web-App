const app = require('express');

const {addAddress, getAddresses, updateAddress, deleteAddress} = require('../controllers/address.controller');
const {authenticateToken} = require('../middleware/auth.middleware');

const router = app.Router();

router.get('/addresses', authenticateToken, getAddresses);
router.post('/addresses', authenticateToken, addAddress);
router.patch('/addresses/:id', authenticateToken, updateAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);

module.exports = router;

