import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  const count = await prisma.user.count();

  console.log("User count:", count);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
