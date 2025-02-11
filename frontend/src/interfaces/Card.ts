export default interface ICard {
  _id: string;
  columnID: string;
  title: string;
  description: string;
  color?: string;
  order: number; // where is it placed
}

