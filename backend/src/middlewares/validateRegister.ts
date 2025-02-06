import { body, ValidationChain } from "express-validator";
import validateUserLogin from "./validateLogin";

const validateUserRegister: ValidationChain[] = [
    body('username').trim().escape().isLength({min:3, max: 25}).withMessage("Username must be between 3 and 25 characters."),
    ...validateUserLogin
];

export default validateUserRegister