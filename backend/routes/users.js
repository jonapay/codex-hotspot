const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.get('/user/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toProfileJSON() });
  } catch (error) {
    next(error);
  }
});

router.put('/user/:id', async (req, res, next) => {
  try {
    const allowedFields = ['username', 'name', 'bio', 'avatarUrl', 'location', 'languages', 'interests', 'birthdate'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toProfileJSON() });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
