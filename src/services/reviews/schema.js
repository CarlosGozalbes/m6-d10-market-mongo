import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ReviewSchema = new Schema(
  {
    comment: { type: String, required: true },
    rate: { type: Number, min: 0, max: 5, required: true },
    productId: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
  }
);

ReviewSchema.static("findReviewsWithProducts", async function (mongoQuery) {
  const total = await this.countDocuments(mongoQuery.criteria); // If I use a normal function (not an arrow) here, the "this" keyword will give me the possibility to access to BooksModel
  const reviews = await this.find(mongoQuery.criteria)
    .limit(mongoQuery.options.limit)
    .skip(mongoQuery.options.skip)
    .sort(mongoQuery.options.sort) // no matter in which order you call this options, Mongo will ALWAYS do SORT, SKIP, LIMIT in this order
    .populate({
      path: "products",
      strictPopulate: false,
      select: "name",
    });
  return { total, reviews };
}); 

export default model("Review", ReviewSchema);
