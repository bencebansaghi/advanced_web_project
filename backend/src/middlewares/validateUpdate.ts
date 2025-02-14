import { body, ValidationChain } from "express-validator";

const validateUserUpdate: ValidationChain[] = [
  body("username")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 3, max: 25 })
    .withMessage("Username must be between 3 and 25 characters."),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[#!&?@$%^&*]/)
    .withMessage("Password must contain at least one special character"),
  body()
    .custom((value, { req }) => {
      if (!req.body.username && !req.body.password) {
        throw new Error("Either username or password must be provided");
      }
      return true;
    })
    .withMessage("Either username or password must be provided"),
];

export default validateUserUpdate;
