import mongoose, {Document, Schema} from "mongoose";

interface ICard extends Document {
    columnID: mongoose.Types.ObjectId,
    title: string,
    description: string,
    color?: string,
    order: number // where is it placed
}

const cardSchema = new Schema({
    columnID: {type: Schema.Types.ObjectId, ref: 'Column', required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    color: {type: String, default: '#D3D3D3'}, // hex code for light gray
    order: {type: Number, required: true}
}, { timestamps: true })

const Card: mongoose.Model<ICard> = mongoose.model<ICard>("Card", cardSchema)

export {ICard, Card}