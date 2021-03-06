import express from "express";
import createHttpError from "http-errors";
import UsersModel from "./schema.js";
import ProductsModel from "../products/schema.js";

const usersRouter = express.Router();

usersRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body); // here happens validation of req.body, if it is not ok Mongoose will throw an error (if it is ok user it is not saved in db yet)
    const { _id } = await newUser.save(); // this is the line in which the interaction with Mongo happens (it is ASYNC!)
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const user = await UsersModel.findById(userId);
    if (user) {
      res.send(user);
    } else {
      next(createHttpError(404, `User with id ${userId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const updatedUser = await UsersModel.findByIdAndUpdate(userId, req.body, {
      new: true, // by default findByIdAndUpdate returns the record pre-modification, if you want to get back the newly updated record you should use the option new: true
    });
    if (updatedUser) {
      res.send(updatedUser);
    } else {
      next(createHttpError(404, `User with id ${userId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const deletedUser = await UsersModel.findByIdAndDelete(userId);
    if (deletedUser) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `User with id ${userId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/:userId/purchaseHistory", async (req, res, next) => {
  try {
    // We gonna receive a productId from req.body. Given that id, we would like to insert the corresponding product into the purchaseHIstory array

    // 1. Find the product in products' collection by id
    const purchasedProduct = await ProductsModel.findById(req.body.productId, {
      _id: 0,
    }); // findById(id, projection), with the usage of projection we could remove the original _id from the returned product --> when I am adding the product to the purchaseHistory array, Mongo will automatically create a brand new _id for each item of the array

    if (purchasedProduct) {
      // 2. If the product is found --> add additional info like purchaseDate
      const productToInsert = {
        ...purchasedProduct.toObject(), // purchasedproduct is a MONGOOSE DOCUMENT (special object with lots of strange fields), it is NOT A NORMAL OBJECT, therefore if I want to spread it I shall use .toObject(), which is going to convert document into a PLAIN OBJECT
        purchaseDate: new Date(),
      };
      console.log(productToInsert);
      // 3. Update the specified user by adding the product to the purchaseHistory

      const modifiedUser = await UsersModel.findByIdAndUpdate(
        req.params.userId, // WHO WE WANT TO MODIFY
        { $push: { purchaseHistory: purchasedProduct } }, // HOW WE WANT TO MODIFY HIM/HER
        { new: true } // OPTIONS
      );
      if (modifiedUser) {
        res.send(modifiedUser);
      } else {
        next(
          createHttpError(404, `User with Id ${req.params.userId} not found!`)
        );
      }
    } else {
      next(createHttpError(404, `product with Id ${req.body.productId} not found!`));
    }
  } catch (error) {
    next(error);
  }
}); // add item to purchase history of a specific user

usersRouter.get("/:userId/purchaseHistory", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);
    if (user) {
      res.send(user.purchaseHistory);
    } else {
      next(
        createHttpError(404, `User with Id ${req.params.userId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
}); // retrieve the purchase history of a specific user

usersRouter.get("/:userId/purchaseHistory/:productId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);
    if (user) {
      const purchasedProduct = user.purchaseHistory.find(
        (product) => product._id.toString() === req.params.productId // You CANNOT compare a string (req.params.productId) with an ObjectID (product._id) --> to compare the two things a solution could be to convert ObjectId into string
      );
      if (purchasedProduct) {
        res.send(purchasedProduct);
      } else {
        next(
          createHttpError(
            404,
            `product with Id ${req.params.productId} not found in purchase history!`
          )
        );
      }
    } else {
      next(
        createHttpError(404, `User with Id ${req.params.userId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
}); // retrieve single item from purchase history of a specific user

usersRouter.put("/:userId/purchaseHistory/:productId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId); // user is a MONGOOSE DOCUMENT, it is NOT A PLAIN OBJECT
    if (user) {
      const index = user.purchaseHistory.findIndex(
        (product) => product._id.toString() === req.params.productId
      );

      if (index !== -1) {
        // we can modify user.purchaseHistory[index] element with what comes from request body
        user.purchaseHistory[index] = {
          ...user.purchaseHistory[index].toObject(), // DO NOT FORGET .toObject() when spreading
          ...req.body,
        };

        await user.save(); // since user is a MONGOOSE DOCUMENT I can use some of his special powers like .save() method
        res.send(user);
      } else {
        next(
          createHttpError(404, `product with id ${req.params.productId} not found!`)
        );
      }
    } else {
      next(
        createHttpError(404, `User with id ${req.params.userId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
}); // modify single item from purchase history of a specific user

usersRouter.delete(
  "/:userId/purchaseHistory/:productId",
  async (req, res, next) => {
    try {
      const modifiedUser = await UsersModel.findByIdAndUpdate(
        req.params.userId, //WHO
        { $pull: { purchaseHistory: { _id: req.params.productId } } }, // HOW
        { new: true } // OPTIONS
      );
      if (modifiedUser) {
        res.send(modifiedUser);
      } else {
        next(
          createHttpError(404, `User with id ${req.params.userId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
); // delete single item from purchase history of a specific user

export default usersRouter;
