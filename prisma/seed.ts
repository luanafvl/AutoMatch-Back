import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const cars = [
  {
    id: "kwid-iconic-2026",
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
  },
  {
    id: "opala-ss-1980",
    name: "Opala SS",
    year: 1980,
    price: 128900,
    category: "Classico",
    engine: "4.1 6cc",
    power: "170 cv",
    consumption: "6 km/l",
    weight: "1400 kg",
    ipva: 3867,
    insurance: 4500,
    maintenance: 3500,
    features: JSON.stringify(["Motor 6 cilindros", "Câmbio manual 4 marchas", "Direção hidráulica", "Bancos em couro", "Som original"]),
    mainImage: "https://source.unsplash.com/400x300/?classic-car",
    thumbnailImages: JSON.stringify([
      "https://source.unsplash.com/200x150/?classic-car",
      "https://source.unsplash.com/200x150/?vintage-car",
      "https://source.unsplash.com/200x150/?car-engine",
      "https://source.unsplash.com/200x150/?car-interior-vintage"
    ])
  },
  {
    id: "dart-swinger-1974",
    name: "Dart Swinger",
    year: 1974,
    price: 175000,
    category: "Classico",
    engine: "5.2 V8",
    power: "240 cv",
    consumption: "4,5 km/l",
    weight: "1550 kg",
    ipva: 5250,
    insurance: 5800,
    maintenance: 4200,
    features: JSON.stringify(["Motor V8", "Câmbio automático 3 marchas", "Direção hidráulica", "Bancos em couro", "Ar-condicionado"]),
    mainImage: "https://source.unsplash.com/400x300/?vintage-muscle-car",
    thumbnailImages: JSON.stringify([
      "https://source.unsplash.com/200x150/?vintage-muscle-car",
      "https://source.unsplash.com/200x150/?american-classic-car",
      "https://source.unsplash.com/200x150/?car-hood",
      "https://source.unsplash.com/200x150/?retro-car"
    ])
  }
];

async function main() {
  console.log("Seeding database...");

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
      fullName: "Administrador",
      email: "admin@automatch.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("  Admin user: admin@automatch.com");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
