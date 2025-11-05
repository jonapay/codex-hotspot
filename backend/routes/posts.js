const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');

const router = express.Router();

function ensureObjectId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
}

router.post('/post', async (req, res, next) => {
  try {
    const { authorId, title, body, mediaUrl, location, radius, opensAt, expiresAt } = req.body;

    const author = ensureObjectId(authorId);
    if (!author) {
      return res.status(400).json({ error: 'Invalid authorId supplied.' });
    }

    if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Location must include a [lng, lat] coordinates array.' });
    }

    const post = await Post.create({
      author,
      title,
      body,
      mediaUrl,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        radius: radius || location.radius,
      },
      opensAt: opensAt ? new Date(opensAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

router.get('/posts', async (req, res, next) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query params are required.' });
    }

    const posts = await Post.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance, 10),
        },
      },
      $expr: {
        $and: [
          {
            $or: [
              { $not: '$opensAt' },
              { $lte: ['$opensAt', new Date()] },
            ],
          },
          {
            $or: [
              { $not: '$expiresAt' },
              { $gte: ['$expiresAt', new Date()] },
            ],
          },
        ],
      },
    })
      .sort('-createdAt')
      .limit(100)
      .populate('author', 'username avatarUrl location');

    res.json({ posts });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
