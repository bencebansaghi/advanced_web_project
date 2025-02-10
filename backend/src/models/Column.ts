import mongoose, { Document, Schema } from "mongoose";

interface IColumn extends Document {
  boardID: mongoose.Types.ObjectId;
  title: string;
  order: number; // where is it placed
}

const columnSchema = new Schema(
  {
    boardID: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

const Column: mongoose.Model<IColumn> = mongoose.model<IColumn>(
  "Column",
  columnSchema
);

export { IColumn, Column };
