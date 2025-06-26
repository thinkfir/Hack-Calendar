const express = require('express');
const router = express.Router();
const hackathonController = require('../controllers/hackathonController');

// GET /api/hackathons
router.get('/', hackathonController.getAllHackathons);

// POST /api/hackathons
router.post('/', hackathonController.createHackathon);

// GET /api/hackathons/:id
router.get('/:id', hackathonController.getHackathonById);

// PUT /api/hackathons/:id
router.put('/:id', hackathonController.updateHackathon);

// DELETE /api/hackathons/:id
router.delete('/:id', hackathonController.deleteHackathon);

module.exports = router;