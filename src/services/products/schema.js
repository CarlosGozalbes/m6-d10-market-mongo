import mongoose from "mongoose";

const { Schema, model } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Phone", "Home", "Clothes", "Sports"],
    },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  },
  {
    timestamps: true,
  }
);

/* productSchema.static("findBooksWithAuthors", async function (mongoQuery) {
  const total = await this.countDocuments(mongoQuery.criteria); // If I use a normal function (not an arrow) here, the "this" keyword will give me the possibility to access to BooksModel
  const books = await this.find(mongoQuery.criteria)
    .limit(mongoQuery.options.limit)
    .skip(mongoQuery.options.skip)
    .sort(mongoQuery.options.sort) // no matter in which order you call this options, Mongo will ALWAYS do SORT, SKIP, LIMIT in this order
    .populate({
      path: "authors",
      select: "firstName lastName",
    });
  return { total, books };
}); */

export default model("Product", productSchema);
