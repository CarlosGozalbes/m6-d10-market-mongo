import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: { type: Date, required: false },
    age: { type: Number, min: 18, max: 65, required: true },
    purchaseHistory: [
      {
        productId: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        title: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default model("User", userSchema);
