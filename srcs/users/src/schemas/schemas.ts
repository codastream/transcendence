import * as z from "zod";

const usernameSchema = z
  .string()
  .min(4, "Username must be at least 4 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username must contain only letters, numbers and underscores",
  )
  .refine((val: string) => !val.includes("admin"), {
    message: "Username cannot contain 'admin'",
  });

const idSchema = z.number().min(1, "ID should be above or equal to 1");

const nicknameSchema = z
  .string()
  .max(50, "Username must be at most 50 characters");

export type SchemaCollectionType = {
  [key: string]: z.ZodType;
};

export const ValidationSchemas: SchemaCollectionType = {
  Username: z.object({
    username: usernameSchema,
  }),
  UserCreate: z.object({
    authId: idSchema,
    email: z.email(),
    username: usernameSchema,
  }),
  FriendAdd: z.object({
    targetId: idSchema,
  }),
  FriendDelete: z.object({
    targetId: idSchema,
  }),
  FriendGet: z.object({
    idUser: idSchema,
  }),
  FriendUpdate: z.object({
    nickname: nicknameSchema,
  }),
};
