const Hackathon = require('../models/Hackathon');

exports.getAllHackathons = (req, res, next) => {
  Hackathon.findAllByUserId(req.user.id, (err, hackathons) => {
    if (err) return next(err);
    res.json(hackathons);
  });
};

exports.createHackathon = (req, res, next) => {
  const { name, startDate, durationHours, projectIdea } = req.body;
  if (!name || !startDate || !durationHours) {
    return res.status(400).json({ error: 'Missing required fields: name, startDate, durationHours' });
  }

  const hackathonData = { name, startDate, durationHours, projectIdea, userId: req.user.id };

  Hackathon.create(hackathonData, (err, hackathon) => {
    if (err) return next(err);
    res.status(201).json(hackathon);
  });
};

exports.getHackathonById = (req, res, next) => {
  Hackathon.findById(req.params.id, req.user.id, (err, hackathon) => {
    if (err) return next(err);
    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found or user not authorized' });
    }
    res.json(hackathon);
  });
};

exports.updateHackathon = (req, res, next) => {
  const { name, startDate, durationHours, projectIdea } = req.body;
  if (!name || !startDate || !durationHours) {
    return res.status(400).json({ error: 'Missing required fields: name, startDate, durationHours' });
  }

  const hackathonData = { name, startDate, durationHours, projectIdea };

  Hackathon.update(req.params.id, req.user.id, hackathonData, (err, result) => {
    if (err) return next(err);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hackathon not found or user not authorized' });
    }
    res.json({ message: 'Hackathon updated successfully' });
  });
};

exports.deleteHackathon = (req, res, next) => {
  Hackathon.delete(req.params.id, req.user.id, (err, result) => {
    if (err) return next(err);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hackathon not found or user not authorized' });
    }
    res.status(204).send();
  });
};