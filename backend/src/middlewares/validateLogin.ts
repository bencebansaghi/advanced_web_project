import { body, ValidationChain } from "express-validator";

const validateUserLogin: ValidationChain[] = [
  body("email")
    .trim()
    .escape()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[#!&?@$%^&*]/)
    .withMessage("Password must contain at least one special character"),
];

export default validateUserLogin;
