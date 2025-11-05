const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(value) {
          return value.length === 2;
        },
        message: 'Location coordinates must be a [lng, lat] pair.',
      },
    },
    name: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const InterestSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    location: LocationSchema,
    interests: [InterestSchema],
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    birthdate: Date,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ 'location.coordinates': '2dsphere' });

UserSchema.methods.toProfileJSON = function toProfileJSON() {
  const user = this.toObject({ versionKey: false });
  return {
    id: user._id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    location: user.location,
    interests: user.interests,
    languages: user.languages,
    birthdate: user.birthdate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
