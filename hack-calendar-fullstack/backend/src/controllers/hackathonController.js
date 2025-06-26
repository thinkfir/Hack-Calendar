const Hackathon = require('../models/Hackathon');

exports.getAllHackathons = (req, res, next) => {
  Hackathon.findAll((err, hackathons) => {
    if (err) return next(err);
    res.json(hackathons);
  });
};

exports.createHackathon = (req, res, next) => {
  const { name, startDate, durationHours, projectIdea } = req.body;
  if (!name || !startDate || !durationHours) {
    return res.status(400).json({ error: 'Missing required fields: name, startDate, durationHours' });
  }

  Hackathon.create({ name, startDate, durationHours, projectIdea }, (err, hackathon) => {
    if (err) return next(err);
    res.status(201).json(hackathon);
  });
};

exports.getHackathonById = (req, res, next) => {
  Hackathon.findById(req.params.id, (err, hackathon) => {
    if (err) return next(err);
    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }
    res.json(hackathon);
  });
};

exports.updateHackathon = (req, res, next) => {
  const { name, startDate, durationHours, projectIdea } = req.body;
  if (!name || !startDate || !durationHours) {
    return res.status(400).json({ error: 'Missing required fields: name, startDate, durationHours' });
  }

  Hackathon.update(req.params.id, { name, startDate, durationHours, projectIdea }, (err, result) => {
    if (err) return next(err);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }
    res.json({ message: 'Hackathon updated successfully' });
  });
};

exports.deleteHackathon = (req, res, next) => {
  Hackathon.delete(req.params.id, (err, result) => {
    if (err) return next(err);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }
    res.status(204).send();
  });
};