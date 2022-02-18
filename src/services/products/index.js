import express from "express";
import createHttpError from "http-errors";
import productsModel from "./schema.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import q2m from "query-to-mongo";

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "striveMarketplace",
  },
});

const productsRouter = express.Router();

productsRouter.post("/", async (req, res, next) => {
  try {
    const newProduct = new productsModel(req.body);
    const { _id } = await newProduct.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const total = await productsModel.countDocuments(mongoQuery.criteria);
    const products = await productsModel
      .find(mongoQuery.criteria)
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort);
    res.send({
      links: mongoQuery.links("/products", total),
      total,
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      products,
    });
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/:ProductId", async (req, res, next) => {
  try {
    const ProductId = req.params.ProductId;

    const Product = await productsModel.findById(ProductId);
    if (Product) {
      res.send(Product);
    } else {
      next(createHttpError(404, `Product with id ${ProductId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.put("/:ProductId", async (req, res, next) => {
  try {
    const ProductId = req.params.ProductId;
    const updatedProduct = await productsModel.findByIdAndUpdate(
      ProductId,
      req.body,
      {
        new: true, // by default findByIdAndUpdate returns the record pre-modification, if you want to get back the newly updated record you should use the option new: true
      }
    );
    if (updatedProduct) {
      res.send(updatedProduct);
    } else {
      next(createHttpError(404, `Product with id ${ProductId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.delete("/:ProductId", async (req, res, next) => {
  try {
    const ProductId = req.params.ProductId;
    const deletedProduct = await productsModel.findByIdAndDelete(ProductId);
    if (deletedProduct) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `Product with id ${ProductId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.post(
  "/:ProductId/imageUrl",
  multer({ storage: cloudinaryStorage }).single("imageUrl"),
  async (req, res, next) => {
    try {
      const ProductId = req.params.ProductId;
      const updatedProduct = await productsModel.findByIdAndUpdate(
        ProductId,
        { imageUrl: req.file.path } /*  cover: req.file.path, */,
        {
          /* cover: req.file.path */
          new: true, // by default findByIdAndUpdate returns the record pre-modification, if you want to get back the newly updated record you should use the option new: true
        }
      );
      if (updatedProduct) {
        res.send(updatedProduct);
      } else {
        next(createHttpError(404, `Product with id ${ProductId} not found!`));
      }
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.get("/:ProductId/comments", async (req, res, next) => {
  try {
    const Product = await productsModel.findById(req.params.ProductId);
    if (Product) {
      res.send(Product.comments);
    } else {
      next(
        createHttpError(
          404,
          `Product with Id ${req.params.ProductId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});



export default productsRouter;
