import mongoose from "mongoose";
export interface User {
  _id?: string;
  fullname?: string;
  email?: string;
  password?: string;
  facebookId?: string;
  googleId?: string;
  gender?: string;
  role?: string;
  location?: string;
  about?: string;
  profileImage?: string;
}
const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  facebookId: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
  },
  role: {
    type: String,
  },
  location: {
    type: String,
  },
  about: {
    type: String,
  },
  profileImage: {
    type: String,
  },
});
const UserModel = mongoose.model<User>("user", userSchema);
export default UserModel;
