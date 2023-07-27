import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  language: {
    type: String,
  },
});

export const Users = mongoose.model('users', userSchema);
