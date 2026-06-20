import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const cars = [
  {
    id: "cfdfe69a5bace2cacdcd2b72a6d456d88dc53ae5ae8863aefc09bad03b5444e2",
    name: "Kwid Iconic 1.0",
    year: 2026,
    price: 85190,
    category: "Popular",
    engine: "1.0 12V Flex",
    power: "70 cv",
    consumption: "15,5 km/l",
    weight: "800 kg",
    ipva: 1703.80,
    insurance: 3200,
    maintenance: 1800,
    features: JSON.stringify(["Airbag", "ABS", "Ar-condicionado", "Direção elétrica", "Vidros elétricos"]),
    mainImage: "https://source.unsplash.com/400x300/?red-car",
    thumbnailImages: JSON.stringify([
      "https://source.unsplash.com/200x150/?red-car",
      "https://source.unsplash.com/200x150/?car-interior",
      "https://source.unsplash.com/200x150/?car-dashboard",
      "https://source.unsplash.com/200x150/?car-wheel"
    ])
  }
];

async function main() {
  console.log("Seeding database...");

  const classicCars = await prisma.car.findMany({
    where: { category: "Classico" },
    select: { id: true },
  });

  if (classicCars.length > 0) {
    await prisma.savedMatch.deleteMany({
      where: { carId: { in: classicCars.map((car) => car.id) } },
    });

    await prisma.car.deleteMany({
      where: { category: "Classico" },
    });
  }

  for (const car of cars) {
    await prisma.car.upsert({
      where: { id: car.id },
      update: car,
      create: car,
    });
    console.log(`  Car: ${car.name}`);
  }

  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@automatch.com" },
    update: {},
    create: {
      firstName: "Administrador",
      surname: "",
      email: "admin@automatch.com",
      password: adminPassword,
      role: "ADMIN",
      avatarUrl: "",
    },
  });
  console.log("  Admin user: admin@automatch.com");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
