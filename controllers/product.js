/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const Product = require('../models/product');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.productById = async (req, res, next, id) => {
  try {
    const product = await Product.findById(id).populate('category');
    if (!product) {
      return res.status(400).json({
        error: 'Product not found',
      });
    }
    req.product = product;
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.read = (req, res) => {
  req.product.photo = undefined;
  res.json(req.product);
};

exports.create = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      });
    }

    try {
      const { name, description, price, category, quantity, shipping } = fields;

      if (
        !name ||
        !description ||
        !price ||
        !category ||
        !quantity ||
        !shipping
      ) {
        return res.status(400).json({
          error: 'All fields are required',
        });
      }

      const product = new Product(fields);

      if (files.photo) {
        if (files.photo.size > 1000000) {
          return res.status(400).json({
            error: 'Image should be less than 1mb in size',
          });
        }
        product.photo.data = fs.readFileSync(files.photo.path);
        product.photo.contentType = files.photo.type;
      }

      const savedProduct = await product.save();
      res.json(savedProduct);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });
};

exports.remove = (req, res) => {
  const { product } = req;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({
      message: 'Product deleted successfully',
      data: deletedProduct,
    });
  });
};

exports.update = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      });
    }

    try {
      let { product } = req;
      product = _.extend(product, fields);

      if (files.photo) {
        if (files.photo.size > 1000000) {
          return res.status(400).json({
            error: 'Image should be less than 1mb in size',
          });
        }
        product.photo.data = fs.readFileSync(files.photo.path);
        product.photo.contentType = files.photo.type;
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });
};

exports.list = async (req, res) => {
  try {
    const order = req.query.order ? req.query.order : 'asc';
    const sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;

    const products = await Product.find()
      .select('-photo')
      .populate('category')
      .sort([[sortBy, order]])
      .limit(limit);

    res.json(products);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.listRelated = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;

    const products = await Product.find({
      _id: { $ne: req.product },
      category: req.product.category,
    })
      .limit(limit)
      .populate('category', '_id name');

    res.json(products);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.listCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', {});

    res.json(categories);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.listBySearch = async (req, res) => {
  try {
    const order = req.body.order ? req.body.order : 'desc';
    const sortBy = req.body.sortBy ? req.body.sortBy : '_id';
    const limit = req.body.limit ? parseInt(req.body.limit, 10) : 100;
    const skip = parseInt(req.body.skip, 10);
    const findArgs = {};

    Object.entries(req.body.filters).forEach(([key, value]) => {
      if (value.length > 0) {
        if (key === 'price') {
          findArgs[key] = {
            $gte: value[0],
            $lte: value[1],
          };
        } else {
          findArgs[key] = value;
        }
      }
    });

    const data = await Product.find(findArgs)
      .select('-photo')
      .populate('category')
      .sort([[sortBy, order]])
      .skip(skip)
      .limit(limit);

    res.json({
      size: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set('Content-Type', req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.listSearch = (req, res) => {
  const query = {};
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    Product.find(query, (err, products) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(products);
    }).select('-photo');
  }
};

exports.decreaseQuantity = (req, res, next) => {
  const bulkOps = req.body.order.products.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $inc: { quantity: -item.count, sold: +item.count } },
    },
  }));

  Product.bulkWrite(bulkOps, {}, (error, products) => {
    if (error) {
      return res.status(400).json({
        error: 'Could not update product',
        data: products,
      });
    }
    next();
  });
};
