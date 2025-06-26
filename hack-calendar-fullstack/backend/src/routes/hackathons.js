const express = require('express');
const router = express.Router();
const hackathonController = require('../controllers/hackathonController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes in this file
router.use(protect);

// Group routes for better organization
router.route('/')
  .get(hackathonController.getAllHackathons)
  .post(hackathonController.createHackathon);

router.route('/:id')
  .get(hackathonController.getHackathonById)
  .put(hackathonController.updateHackathon)
  .delete(hackathonController.deleteHackathon);

module.exports = router;