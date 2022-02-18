import express from "express";
import createHttpError from "http-errors";
import reviewsModel from "./schema.js";
import multer from "multer";

import q2m from "query-to-mongo";
import ProductModel from "../products/schema.js";

const reviewsRouter = express.Router();

reviewsRouter.post("/", async (req, res, next) => {
  try {
    const newReview = new reviewsModel(req.body);
    const { _id } = await newReview.save();
    await ProductModel.findByIdAndUpdate(req.body.productId, {
      $push: { reviews: _id },
    });
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

reviewsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const { total, reviews } = await reviewsModel.findReviewsWithProducts(
      mongoQuery
    );
    res.send({
      links: mongoQuery.links("/reviews", total),
      total,
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      reviews,
    });
  } catch (error) {
    next(error);
  }
});

reviewsRouter.get("/:ReviewId", async (req, res, next) => {
  try {
    const ReviewId = req.params.ReviewId;

    const Review = await reviewsModel.findById(ReviewId);
    if (Review) {
      res.send(Review);
    } else {
      next(createHttpError(404, `Review with id ${ReviewId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

reviewsRouter.put("/:ReviewId", async (req, res, next) => {
  try {
    const ReviewId = req.params.ReviewId;
    const updatedReview = await reviewsModel.findByIdAndUpdate(
      ReviewId,
      req.body,
      {
        new: true, // by default findByIdAndUpdate returns the record pre-modification, if you want to get back the newly updated record you should use the option new: true
      }
    );
    if (updatedReview) {
      res.send(updatedReview);
    } else {
      next(createHttpError(404, `Review with id ${ReviewId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

reviewsRouter.delete("/:ReviewId", async (req, res, next) => {
  try {
    const ReviewId = req.params.ReviewId;
    const deletedReview = await reviewsModel.findByIdAndDelete(ReviewId);
    if (deletedReview) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `Review with id ${ReviewId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

export default reviewsRouter;
