/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
const User = require('../models/user');
const { Order } = require('../models/order');

exports.userById = async (req, res, next, id) => {
  try {
    const user = await User.findById(id).exec();

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
      });
    }

    req.profile = user;
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.update = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.profile._id },
      { $set: req.body },
      { new: true },
    ).exec();

    if (!user) {
      return res.status(400).json({
        error: 'You are not authorized to perform this action',
      });
    }

    user.hashed_password = undefined;
    user.salt = undefined;
    res.json(user);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.addOrderToUserHistory = async (req, res, next) => {
  const history = [];

  req.body.order.products.forEach((item) => {
    history.push({
      _id: item._id,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.count,
      transaction_id: req.body.order.transaction_id,
      amount: req.body.order.amount,
    });
  });

  try {
    const data = await User.findOneAndUpdate(
      { _id: req.profile._id },
      { $push: { history } },
      { new: true },
    ).exec();

    // eslint-disable-next-line no-console
    console.log(data);

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('user', '_id name address')
      .sort('-created')
      .exec();

    res.json(users);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.purchaseHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.profile._id })
      .populate('user', '_id name')
      .sort('-created')
      .exec();

    res.json(orders);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};
