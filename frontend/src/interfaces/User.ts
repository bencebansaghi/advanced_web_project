export default interface IUser {
  _id: string;
  email: string;
  password: string;
  username: string;
  isAdmin?: boolean;
}
