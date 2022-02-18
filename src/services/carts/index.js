import express from "express";
import createHttpError from "http-errors";
import ProductsModel from "../Products/schema.js";
import CartsModel from "./schema.js";

const cartsRouter = express.Router();

cartsRouter.post("/:ownerId/addToCart", async (req, res, next) => {
  // We are going to receive the ProductId and the quantity in req.body

  try {
    const { ProductId, quantity } = req.body;

    // 1. Find Product in Products' collection by ProductId
    const purchasedProduct = await ProductsModel.findById(ProductId);

    if (purchasedProduct) {
      // 2. Is the Product already in the ACTIVE cart of the specified ownerId?
      const isProductThere = await CartsModel.findOne({
        ownerId: req.params.ownerId,
        "products.productId": purchasedProduct.productId,
        status: "active",
      });

      if (isProductThere) {
        // 3. If it is there --> increase previous quantity
        const updatedCart = await CartsModel.findOneAndUpdate(
          {
            ownerId: req.params.ownerId,
            status: "active",
            "products.asin": purchasedProduct.productId,
          },
          { $inc: { "products.$.quantity": quantity } }, // in JS --> find the index of the element => products[index].quantity += quantity
          { new: true }
        );
        res.send(updatedCart);
      } else {
        // 4. If it is not --> add it to the cart
        const productToInsert = { ...purchasedProduct.toObject(), quantity };

        const modifiedCart = await CartsModel.findOneAndUpdate(
          { ownerId: req.params.ownerId, status: "active" },
          { $push: { products: productToInsert } },
          {
            new: true,
            upsert: true, // if the "active" cart of that user is not found --> just create it automatically please
          }
        );
        res.send(modifiedCart);
      }
    } else {
      next(createHttpError(404, `Product with id ${ProductId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

cartsRouter.get("/:ownerId/products", async (req, res, next) => {
  try {
    const cart = await CartsModel.findById(req.params.ownerId);
    if (blogPost) {
      res.send(cart.products);
    } else {
      next(
        createHttpError(
          404,
          `Cart with owner Id ${req.params.ownerId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

cartsRouter.delete("/:ownerId/products/:productId", async (req, res, next) => {
  try {
    const modifiedCart = await CartsModel.findByIdAndUpdate(
      req.params.ownerId, //WHO
      { $pull: { products: { _id: req.params.productId } } }, // HOW
      { new: true } // OPTIONS
    );
    if (modifiedCart) {
      res.send(modifiedCart);
    } else {
      next(
        createHttpError(
          404,
          `Cart with Id owner ${req.params.ownerId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
}); 

export default cartsRouter;
