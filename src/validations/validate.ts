import joi from "joi";

const joiUserSchema = joi.object({
  fullname: joi.string().required(),
  email: joi
    .string()
    .trim()
    .lowercase()
    .email({
      minDomainSegments: 2,
      tlds: {
        allow: ["com", "net", "in"],
      },
    }),
  password: joi.string().required(),
});

export default joiUserSchema;
