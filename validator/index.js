/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable consistent-return */
const { validationResult } = require('express-validator');

exports.userSignupValidator = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(400).json({ error: firstError });
  }

  next();
};
