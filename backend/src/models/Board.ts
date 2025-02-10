import mongoose, { Document, Schema } from "mongoose";

interface IBoard extends Document {
  userID: mongoose.Types.ObjectId;
  title: string;
}

const boardSchema = new Schema(
  {
    userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const Board: mongoose.Model<IBoard> = mongoose.model<IBoard>(
  "Board",
  boardSchema
);

export { IBoard, Board };
