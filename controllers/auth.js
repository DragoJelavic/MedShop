/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const jwt = require('jsonwebtoken'); // to generate signed token
const { expressjwt: expressJwt } = require('express-jwt'); // for authorization check
const User = require('../models/user');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.signup = (req, res) => {
  const newUser = new User(req.body);
  newUser.save((err, user) => {
    if (err) {
      return res.status(400)
        .json({
          error: errorHandler(err),
        });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    return res.json({
      user,
    });
  });
};

exports.signin = (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400)
        .json({
          error: 'User with that email does not exist. Please signup',
        });
    }
    if (!user.authenticate(password)) {
      return res.status(401)
        .json({
          error: 'Email and password dont match',
        });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.cookie('t', token, { expire: new Date() + 9999 });
    const {
      // eslint-disable-next-line no-shadow
      _id, name, email, role,
    } = user;
    return res.json({
      token,
      user: {
        _id, email, name, role,
      },
    });
  });
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
    return res.status(403)
      .json({
        error: 'Access denied',
      });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403)
      .json({
        error: 'Admin resourse! Access denied',
      });
  }
  next();
};
