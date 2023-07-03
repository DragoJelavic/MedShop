/* eslint-disable no-console */
/* eslint-disable consistent-return */
const nodemailer = require('nodemailer');
const { Order } = require('../models/order');
const { errorHandler } = require('../helpers/dbErrorHandler');
require('dotenv').config();

exports.orderById = (req, res, next, id) => {
  Order.findById(id)
    .populate('products.product', 'name price')
    .exec((err, order) => {
      if (err || !order) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      req.order = order;
      next();
    });
};

exports.create = (req, res) => {
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);
  order.save((error, data) => {
    if (error) {
      return res.status(400).json({
        error: errorHandler(error),
      });
    }
    res.json(data);
  });

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

  const mailOptionsBuyer = {
    from: process.env.ADMIN_MAIL,
    to: order.user.email,
    subject: `Order no. ${order.transaction_id}`,
    html: `<h1>Hey ${req.profile.name}, Thank you for shopping with us.</h1>
    <h2>Your order is on the way to ${order.address} </h2>
    <h2>This is what you ordered:</h2>
    <h2>Product details:</h2>
            <hr />
            ${order.products
    .map((p) => `<div style="background-color:#c0edcc; width:33.33%">
                        <h3>Product Name: ${p.name}</h3>
                        <h3>Product Price: ${p.price}</h3>
                        <h3>Product Quantity: ${p.count}</h3>
                        <hr />
                </div>`)
    .join('--------------------')}
            <h2>Total order cost: ${order.amount}<h2>
            <h2>Total products: ${order.products.length}</h2>
            <br/>
            <h3>Thank your for shopping with Medshop.</h3>`,
  };

  try {
    transporter.sendMail(mailOptionsBuyer, (error, info) => {
      if (error) {
        console.log(error);
        throw new Error('Failed to send email.');
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
    html: `<h1>Hey Admin, Somebody just made a purchase in your ecommerce store</h1>
    <h2>Customer name: ${order.user.name}</h2>
    <h2>Customer address: ${order.address}</h2>
    <h2>User's purchase history: ${order.user.history.length} purchase</h2>
    <h2>User's email: ${order.user.email}</h2>
    <h2>Total products: ${order.products.length}</h2>
    <h2>Transaction ID: ${order.transaction_id}</h2>
    <h2>Order status: ${order.status}</h2>
    <br/>
    <h2><b>Product details:</b></h2>
    <hr />
    ${order.products
    .map((p) => `<div style="background-color:#c0edcc; width:33.33%">
                <h3><b>Product Name:</b> ${p.name}</h3>
                <h3><b>Product Price:</b> ${p.price}</h3>
                <h3><b>Product Quantity:</b> ${p.count}</h3>
                <hr/>
        </div>`)
    .join('--------------------')}
    <h2>Total order cost: ${order.amount}<h2>
    <br/>
    <h3>Login to your dashboard</a> to see the order in detail.</h3>`,
  };

  transporter.sendMail(mailOptionsAdmin, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
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
