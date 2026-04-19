const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function ensureAdminProfile() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const rawPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const shouldResetPassword = process.env.ADMIN_RESET_PASSWORD === "true";
  const phoneNumber = process.env.ADMIN_PHONE || "+51999999999";
  const firstName = process.env.ADMIN_FIRST_NAME || "Admin";
  const lastName = process.env.ADMIN_LAST_NAME || "WolfGym";
  const emergencyPhone = process.env.ADMIN_EMERGENCY_PHONE || null;

  const existingByUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  let adminUser;

  if (existingByUsername) {
    const updateData = {
      role: "admin",
      firstName,
      lastName,
    };
    if (shouldResetPassword) {
      updateData.password = await bcrypt.hash(rawPassword, 10);
    }

    adminUser = await prisma.user.update({
      where: { id: existingByUsername.id },
      data: updateData,
    });
  } else {
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    adminUser = await prisma.user.create({
      data: {
        username,
        password: passwordHash,
        role: "admin",
        firstName,
        lastName,
        phoneNumber,
      },
    });
  }

  await prisma.clientProfile.upsert({
    where: { user_id: adminUser.id },
    create: {
      user_id: adminUser.id,
      profile_first_name: firstName,
      profile_last_name: lastName,
      profile_phone: adminUser.phoneNumber,
      profile_emergency_phone: emergencyPhone,
      profile_plan: "Administrador",
      profile_start_date: new Date(),
      profile_end_date: null,
    },
    update: {
      profile_first_name: firstName,
      profile_last_name: lastName,
      profile_phone: adminUser.phoneNumber,
      profile_emergency_phone: emergencyPhone,
    },
  });

  console.log("Admin listo:");
  console.log(`- username: ${username}`);
  console.log(`- phone: ${adminUser.phoneNumber}`);
  console.log(
    shouldResetPassword || !existingByUsername
      ? "- password: (la que configuraste en ADMIN_PASSWORD)"
      : "- password: sin cambios (usa ADMIN_RESET_PASSWORD=true para forzar)"
  );
}

ensureAdminProfile()
  .catch((error) => {
    console.error("Error creando perfil admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
