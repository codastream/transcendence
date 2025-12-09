import * as z from 'zod'

const usernameSchema = z
  .string()
  .min(4, 'Username must be at least 4 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username must contain only letters, numbers and underscores'
  )
  .refine((val: string) => !val.includes('admin'), {
    message: "Username cannot contain 'admin'",
  })

export type SchemaCollectionType = {
  [key: string]: z.ZodType
}

export const ValidationSchemas: SchemaCollectionType = {
  Username: z.object({
    username: usernameSchema,
  }),
  UserCreate: z.object({
    authId: z.uuid(),
    email: z.email(),
    username: usernameSchema,
  }),
}
