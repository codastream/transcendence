import path from "path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),
  migrate: {
    async adapter() {
      const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
      return new PrismaLibSQL({
        url: process.env.DATABASE_URL ?? "file:./data/um.db",
      });
    },
  },
});
