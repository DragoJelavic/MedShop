/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const jwt = require('jsonwebtoken'); // to generate signed token
const { expressjwt: expressJwt } = require('express-jwt'); // for authorization check
const User = require('../models/user');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.signup = async (req, res) => {
  try {
    const newUser = new User(req.body);
    const user = await newUser.save();
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const expiresInDays = 7;
    const expirationMs = expiresInDays * 24 * 60 * 60 * 1000;
    const expirationDate = new Date().getTime() + expirationMs;

    if (!user) {
      return res.status(400).json({
        error: 'User with that email does not exist. Please sign up.',
      });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: 'Email and password do not match.',
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: expiresInDays,
    });

    res.cookie('t', token, { expire: new Date(expirationDate) });

    const { _id, name, email: userEmail, role } = user;

    return res.json({
      token,
      user: {
        _id,
        userEmail,
        name,
        role,
      },
    });
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

exports.signout = (req, res) => {
  res.clearCookie('t');
  res.json({ message: 'Signout success' });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'auth',
  algorithms: ['RS256'],
});

exports.isAuth = (req, res, next) => {
  const user = req.profile && req.auth && req.profile._id === req.auth._id;
  if (!user) {
    return res.status(403).json({
      error: 'Access denied',
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: 'Admin resourse! Access denied',
    });
  }
  next();
};
