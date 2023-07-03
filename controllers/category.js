/* eslint-disable consistent-return */
const Category = require('../models/category');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.categoryById = async (req, res, next, id) => {
  try {
    const category = await Category.findById(id).exec();
    if (!category) {
      return res.status(400).json({
        error: 'Category not found.',
      });
    }
    req.category = category;
    next();
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

exports.create = async (req, res) => {
  try {
    const category = new Category(req.body);
    const data = await category.save();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

exports.read = (req, res) => {
  res.json(req.category);
};

exports.update = async (req, res) => {
  try {
    const { category } = req;
    category.name = req.body.name;
    const data = await category.save();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

exports.remove = async (req, res) => {
  try {
    const { category } = req;
    const data = await category.remove();
    res.json({
      message: 'Category deleted.',
      categoryData: data,
    });
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

exports.list = async (req, res) => {
  try {
    const data = await Category.find().exec();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};
