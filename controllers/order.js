/* eslint-disable no-console */
/* eslint-disable consistent-return */
const nodemailer = require('nodemailer');
// eslint-disable-next-line import/no-extraneous-dependencies
const ejs = require('ejs');
const fs = require('fs');
const { Order } = require('../models/order');
const { errorHandler } = require('../helpers/dbErrorHandler');
require('dotenv').config();

const customerTemplate = fs.readFileSync(
  '../templates/customer_order_email.ejs',
  'utf-8',
);
const adminTemplate = fs.readFileSync(
  '../templates/admin_order_email.ejs',
  'utf-8',
);

exports.orderById = async (req, res, next, id) => {
  try {
    const order = await Order.findById(id)
      .populate('products.product', 'name price')
      .exec();
    if (!order) {
      return res.status(400).json({
        error: 'Order not found.',
      });
    }
    req.order = order;
    next();
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

exports.create = async (req, res) => {
  let order;
  try {
    req.body.order.user = req.profile;
    order = new Order(req.body.order);
    const savedOrder = await order.save();
    res.json(savedOrder);
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.ADMIN_MAIL,
      pass: process.env.ADMIN_PASS,
    },
  });

  const renderOptions = {
    profile: req.profile,
    order,
  };

  const renderedCustomerTemplate = ejs.render(customerTemplate, renderOptions);
  const renderedAdminTemplate = ejs.render(adminTemplate, renderOptions);

  const mailOptionsBuyer = {
    from: process.env.ADMIN_MAIL,
    to: order.user.email,
    subject: `Order no. ${order.transaction_id}`,
    html: renderedCustomerTemplate,
  };

  try {
    transporter.sendMail(mailOptionsBuyer, (error, info) => {
      if (error) {
        console.log(error);
        throw new Error('Failed to send email to buyer');
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });
  } catch (error) {
    // Handle the error here
    console.log(error);
  }

  const mailOptionsAdmin = {
    from: 'noreply@medhsop.com',
    to: process.env.ADMIN_MAIL,
    subject: `New order no. ${order.transaction_id}`,
    html: renderedAdminTemplate,
  };

  try {
    transporter.sendMail(mailOptionsAdmin, (error, info) => {
      if (error) {
        console.log(error);
        throw new Error('Failed to send email to admin.');
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });
  } catch (error) {
    // Handle the error here
    console.log(error);
  }
};

exports.listOrders = (req, res) => {
  Order.find()
    .populate('user', '_id name address')
    .sort('-created')
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(orders);
    });
};

exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path('status').enumValues);
};

exports.updateOrderStatus = (req, res) => {
  Order.update(
    { _id: req.body.orderId },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(order);
    },
  );
};
