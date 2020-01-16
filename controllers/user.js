const User = require("../models/user");
const jwt = require("jsonwebtoken");
const expressJWT = require("express-jwt");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.signup = (req, res) => {
  //console.log("req.body", req.body);
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({ err: errorHandler(err) });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user
    });
  });
};

exports.signin = (req, res) => {
  //find user with email
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        err: "User with that email does not exist"
      });
    }
    //check if passw and mail match
    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and passw dont match"
      });
    }
    //generate token with user id and secret
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.cookie("t", token, { expire: new Date() + 9999 });
    const { _id, name, email, role } = user;
    return res.json({ token, user: { _id, email, name, role } });
  });
};

exports.signout = (req, res) => {
  //clear the cookie
  res.clearCookie("t");
  res.json({ message: "signed out successfully" });
};
