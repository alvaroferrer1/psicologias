const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "owner@example.local";
  const password = process.env.SEED_ADMIN_PASSWORD || `ChangeMe-${Math.random().toString(36).slice(2, 10)}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email,
      name: "Administrador Principal",
      password: hashedPassword,
      role: "ADMIN",
      colegiado: "0000",
    },
  });

  console.log("Usuario administrador creado/actualizado:", admin.email);
  console.log("Contraseña temporal generada:", password);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
