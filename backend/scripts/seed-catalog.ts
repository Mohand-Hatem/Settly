import { PrismaClient, AreaLevel, PropertyType, ListingIntent, PropertyStatus, AmenityCategory, Role } from "@prisma/client";
import { uuidv7 } from "uuidv7";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const mapPath = path.resolve(process.cwd(), "scripts/cloudinary-images-map.json");
let cloudinaryMap: Record<string, { secureUrl: string; publicId: string }> = {};
if (fs.existsSync(mapPath)) {
  cloudinaryMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
}

function resolveImage(localPath: string): { url: string; cloudinaryPublicId: string } {
  const filename = path.basename(localPath);
  const mapped = cloudinaryMap[filename];
  if (mapped) {
    return {
      url: mapped.secureUrl,
      cloudinaryPublicId: mapped.publicId,
    };
  }
  return {
    url: localPath,
    cloudinaryPublicId: `settly/catalog/${filename.replace(/\.[^/.]+$/, "")}`,
  };
}

async function main() {
  console.log("🌱 Starting Settly Catalog Database Seeding...");

  // 1. Create or Find Areas
  console.log("📍 Seeding Areas & Districts...");
  
  const cairoGovId = uuidv7();
  const cairoGov = await prisma.area.upsert({
    where: { slug: "cairo" },
    update: {},
    create: {
      id: cairoGovId,
      slug: "cairo",
      nameEn: "Cairo",
      nameAr: "القاهرة",
      level: AreaLevel.GOVERNORATE,
      aliases: ["Al Qahirah", "Cairo Governorate"],
      centerLat: 30.0444,
      centerLng: 31.2357,
    },
  });

  const newCairoCityId = uuidv7();
  const newCairoCity = await prisma.area.upsert({
    where: { slug: "new-cairo" },
    update: {},
    create: {
      id: newCairoCityId,
      slug: "new-cairo",
      nameEn: "New Cairo",
      nameAr: "القاهرة الجديدة",
      parentId: cairoGov.id,
      level: AreaLevel.CITY,
      aliases: ["5th Settlement", "التجمع الخامس"],
      centerLat: 30.025,
      centerLng: 31.48,
    },
  });

  const goldenSquareId = uuidv7();
  const goldenSquare = await prisma.area.upsert({
    where: { slug: "golden-square" },
    update: {},
    create: {
      id: goldenSquareId,
      slug: "golden-square",
      nameEn: "Golden Square",
      nameAr: "المربع الذهبي",
      parentId: newCairoCity.id,
      level: AreaLevel.DISTRICT,
      aliases: ["Golden Square New Cairo"],
      centerLat: 30.0155,
      centerLng: 31.488,
    },
  });

  const mividaId = uuidv7();
  const mividaArea = await prisma.area.upsert({
    where: { slug: "mivida" },
    update: {},
    create: {
      id: mividaId,
      slug: "mivida",
      nameEn: "Mivida",
      nameAr: "ميفيدا",
      parentId: newCairoCity.id,
      level: AreaLevel.COMPOUND,
      aliases: ["Mivida Emaar"],
      centerLat: 30.0185,
      centerLng: 31.495,
    },
  });

  const katameyaId = uuidv7();
  const katameyaArea = await prisma.area.upsert({
    where: { slug: "katameya-dunes" },
    update: {},
    create: {
      id: katameyaId,
      slug: "katameya-dunes",
      nameEn: "Katameya Dunes",
      nameAr: "قطامية ديونز",
      parentId: newCairoCity.id,
      level: AreaLevel.COMPOUND,
      aliases: ["Katameya 5th Settlement"],
      centerLat: 30.008,
      centerLng: 31.472,
    },
  });

  const zayedCityId = uuidv7();
  const zayedCity = await prisma.area.upsert({
    where: { slug: "sheikh-zayed" },
    update: {},
    create: {
      id: zayedCityId,
      slug: "sheikh-zayed",
      nameEn: "Sheikh Zayed",
      nameAr: "الشيخ زايد",
      level: AreaLevel.CITY,
      aliases: ["Zayed City", "مدينة الشيخ زايد"],
      centerLat: 30.038,
      centerLng: 30.985,
    },
  });

  const karmellId = uuidv7();
  const karmellArea = await prisma.area.upsert({
    where: { slug: "karmell-sheikh-zayed" },
    update: {},
    create: {
      id: karmellId,
      slug: "karmell-sheikh-zayed",
      nameEn: "Karmell",
      nameAr: "كارميل",
      parentId: zayedCity.id,
      level: AreaLevel.COMPOUND,
      aliases: ["SODIC Karmell"],
      centerLat: 30.038,
      centerLng: 30.985,
    },
  });

  const sahelCityId = uuidv7();
  const sahelCity = await prisma.area.upsert({
    where: { slug: "north-coast" },
    update: {},
    create: {
      id: sahelCityId,
      slug: "north-coast",
      nameEn: "North Coast",
      nameAr: "الساحل الشمالي",
      level: AreaLevel.CITY,
      aliases: ["Sahel", "الساحل"],
      centerLat: 30.985,
      centerLng: 28.71,
    },
  });

  const sidiAbdElRahmanId = uuidv7();
  const sidiAbdElRahman = await prisma.area.upsert({
    where: { slug: "sidi-abd-el-rahman" },
    update: {},
    create: {
      id: sidiAbdElRahmanId,
      slug: "sidi-abd-el-rahman",
      nameEn: "Sidi Abd El Rahman",
      nameAr: "سيدي عبد الرحمن",
      parentId: sahelCity.id,
      level: AreaLevel.DISTRICT,
      aliases: ["Marassi Sidi Abd El Rahman"],
      centerLat: 30.985,
      centerLng: 28.71,
    },
  });

  // 2. Seed Amenities
  console.log("✨ Seeding Amenities...");
  const amenityDefs = [
    { slug: "private-pool", nameEn: "Private Pool", nameAr: "حمام سباحة خاص", category: AmenityCategory.EXTERIOR },
    { slug: "golf-frontage", nameEn: "Golf Frontage", nameAr: "إطلالة على ملعب الجولف", category: AmenityCategory.LOCATION },
    { slug: "maids-room", nameEn: "Maid's Room", nameAr: "غرفة خادمة", category: AmenityCategory.INTERIOR },
    { slug: "smart-home", nameEn: "Smart Home", nameAr: "منزل ذكي", category: AmenityCategory.FACILITY },
    { slug: "panoramic-view", nameEn: "Panoramic View", nameAr: "إطلالة بانورامية", category: AmenityCategory.LOCATION },
    { slug: "private-terrace", nameEn: "Private Terrace", nameAr: "تراس خاص", category: AmenityCategory.EXTERIOR },
    { slug: "lagoon-access", nameEn: "Direct Lagoon Access", nameAr: "مدخل مباشر للبحيرة", category: AmenityCategory.LOCATION },
    { slug: "concierge", nameEn: "Concierge Desk", nameAr: "خدمة كونسيرج", category: AmenityCategory.SECURITY },
    { slug: "clubhouse", nameEn: "Clubhouse Membership", nameAr: "عضوية النادي", category: AmenityCategory.FACILITY },
    { slug: "central-park", nameEn: "Central Park View", nameAr: "إطلالة على الحديقة المركزية", category: AmenityCategory.LOCATION },
    { slug: "heated-pool", nameEn: "Heated Swimming Pool", nameAr: "حمام سباحة مدفأ", category: AmenityCategory.EXTERIOR },
    { slug: "elevator", nameEn: "Elevator Installed", nameAr: "مصعد خاص", category: AmenityCategory.FACILITY },
    { slug: "rooftop-pool", nameEn: "Private Rooftop Pool", nameAr: "حمام سباحة على السطح", category: AmenityCategory.EXTERIOR },
    { slug: "lake-frontage", nameEn: "Lake Frontage", nameAr: "واجهة على البحيرة", category: AmenityCategory.LOCATION },
  ];

  const amenityMap = new Map<string, string>();
  for (const a of amenityDefs) {
    const record = await prisma.amenity.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        id: uuidv7(),
        slug: a.slug,
        nameEn: a.nameEn,
        nameAr: a.nameAr,
        category: a.category,
      },
    });
    amenityMap.set(a.slug, record.id);
  }

  // 3. Seed Verified Agent (Hana K.)
  console.log("👤 Seeding Verified Agent Hana K...");
  const agentEmail = "hana.k@settly.estate";
  const agentUser = await prisma.user.upsert({
    where: { email: agentEmail },
    update: { role: Role.AGENT },
    create: {
      id: uuidv7(),
      name: "Hana K.",
      email: agentEmail,
      emailVerified: true,
      role: Role.AGENT,
      image: resolveImage("/images/phone.jpg").url,
    },
  });

  await prisma.agentProfile.upsert({
    where: { userId: agentUser.id },
    update: { isVerified: true },
    create: {
      id: uuidv7(),
      userId: agentUser.id,
      licenseNumber: "CAI-2024-8841",
      brokerageName: "Settly Premier Advisory",
      bioEn: "Specialist advisor covering Golden Square, New Cairo, and premium freehold compounds with over 8 years in the Egyptian luxury real estate sector.",
      bioAr: "مستشارة عقارية متخصصة في المربع الذهبي والتجمع الخامس والمجمعات السكنية الفاخرة.",
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  // 4. Seed 8 Authentic Egyptian Residences
  console.log("🏰 Seeding 8 Verified Residences into PostgreSQL...");
  const propertiesData = [
    {
      slug: "lake-view-signature-villa",
      titleEn: "Lake View Signature Villa",
      titleAr: "فيلا ليك فيو الفاخرة",
      descriptionEn: "An architectural masterpiece in the heart of Golden Square, New Cairo. Spanning 540 m² with private infinity pool, double-height reception, and direct golf views.",
      descriptionAr: "تحفة معمارية في قلب المربع الذهبي بالقاهرة الجديدة بمساحة 540 م² وحمام سباحة خاص وإطلالة على الجولف.",
      propertyType: PropertyType.VILLA,
      listingIntent: ListingIntent.SALE,
      price: 32500000n * 100n, // In piastres: 32.5M EGP
      bedrooms: 5,
      bathrooms: 6,
      areaSqm: 540.0,
      latitude: 30.0155,
      longitude: 31.488,
      areaId: goldenSquare.id,
      featured: true,
      images: [
        { url: "/images/11.jpg", captionEn: "Façade at dusk", isCover: true, order: 0 },
        { url: "/images/4.jpg", captionEn: "Double height living area", isCover: false, order: 1 },
        { url: "/images/7.jpg", captionEn: "Private landscaped terrace", isCover: false, order: 2 },
        { url: "/images/8.jpg", captionEn: "Master bathroom suite", isCover: false, order: 3 },
        { url: "/images/10.jpg", captionEn: "Rear garden & reflecting pool", isCover: false, order: 4 },
      ],
      amenitySlugs: ["private-pool", "golf-frontage", "maids-room", "smart-home"],
    },
    {
      slug: "terrace-skyline-duplex",
      titleEn: "Terrace Skyline Duplex",
      titleAr: "دوبلكس سكاي لاين مع تراس خاص",
      descriptionEn: "Modern duplex in Karmell Sheikh Zayed featuring 320 m² of contemporary open-plan design, floor-to-ceiling glass, and 65 m² private terrace.",
      descriptionAr: "دوبلكس عصري في كارميل الشيخ زايد بمساحة 320 م² وتصميم مفتوح وتراس خاص 65 م².",
      propertyType: PropertyType.DUPLEX,
      listingIntent: ListingIntent.SALE,
      price: 18900000n * 100n, // 18.9M EGP
      bedrooms: 4,
      bathrooms: 4,
      areaSqm: 320.0,
      latitude: 30.038,
      longitude: 30.985,
      areaId: karmellArea.id,
      featured: true,
      images: [
        { url: "/images/5.jpg", captionEn: "Terrace view", isCover: true, order: 0 },
        { url: "/images/6.jpg", captionEn: "Living room", isCover: false, order: 1 },
      ],
      amenitySlugs: ["panoramic-view", "private-terrace", "smart-home"],
    },
    {
      slug: "azure-horizon-penthouse",
      titleEn: "Azure Horizon Penthouse",
      titleAr: "بنتهاوس الأفق اللازوردي",
      descriptionEn: "Ultra-luxury penthouse in Sidi Abd El Rahman, North Coast with direct lagoon views, expansive 120 m² roof terrace, and private infinity dip pool.",
      descriptionAr: "بنتهاوس فائق الفخامة في سيدي عبد الرحمن بالساحل الشمالي بإطلالة مباشرة على اللاجون.",
      propertyType: PropertyType.PENTHOUSE,
      listingIntent: ListingIntent.SALE,
      price: 44000000n * 100n, // 44.0M EGP
      bedrooms: 4,
      bathrooms: 5,
      areaSqm: 410.0,
      latitude: 30.985,
      longitude: 28.71,
      areaId: sidiAbdElRahman.id,
      featured: true,
      images: [
        { url: "/images/8.jpg", captionEn: "Penthouse terrace", isCover: true, order: 0 },
        { url: "/images/10.jpg", captionEn: "Lagoon perspective", isCover: false, order: 1 },
      ],
      amenitySlugs: ["lagoon-access", "private-pool", "concierge"],
    },
    {
      slug: "courtyard-townhouse",
      titleEn: "Courtyard Townhouse",
      titleAr: "تاون هاوس كورت يارد",
      descriptionEn: "Elegant family townhouse in ZED East, New Cairo. 285 m² with landscaped internal courtyard, clubhouse membership, and premium finishes.",
      descriptionAr: "تاون هاوس عائلي في زد إيست القاهرة الجديدة بمساحة 285 م² وحديقة داخلية منسقة.",
      propertyType: PropertyType.TOWNHOUSE,
      listingIntent: ListingIntent.SALE,
      price: 21400000n * 100n, // 21.4M EGP
      bedrooms: 3,
      bathrooms: 4,
      areaSqm: 285.0,
      latitude: 30.0115,
      longitude: 31.512,
      areaId: goldenSquare.id,
      featured: false,
      images: [
        { url: "/images/9.jpg", captionEn: "Courtyard entrance", isCover: true, order: 0 },
        { url: "/images/1.jpg", captionEn: "Garden patio", isCover: false, order: 1 },
      ],
      amenitySlugs: ["clubhouse", "central-park", "smart-home"],
    },
    {
      slug: "katameya-dunes-twin-house",
      titleEn: "Katameya Dunes Twin House",
      titleAr: "توين هاوس قطامية ديونز",
      descriptionEn: "Spacious semi-finished twin house overlooking the 27-hole championship golf course in Katameya Dunes, 5th Settlement.",
      descriptionAr: "توين هاوس واسع يطل على ملعب الجولف المكون من 27 حفرة في قطامية ديونز بالتجمع الخامس.",
      propertyType: PropertyType.TOWNHOUSE,
      listingIntent: ListingIntent.SALE,
      price: 24800000n * 100n, // 24.8M EGP
      bedrooms: 4,
      bathrooms: 4,
      areaSqm: 380.0,
      latitude: 30.008,
      longitude: 31.472,
      areaId: katameyaArea.id,
      featured: false,
      images: [
        { url: "/images/2.jpg", captionEn: "Golf course front", isCover: true, order: 0 },
        { url: "/images/3.jpg", captionEn: "Rear lawn", isCover: false, order: 1 },
      ],
      amenitySlugs: ["golf-frontage", "maids-room"],
    },
    {
      slug: "mivida-crescent-standalone",
      titleEn: "Mivida Crescent Standalone",
      titleAr: "فيلا مستقلة ذا كريسنت ميفيدا",
      descriptionEn: "Grand standalone villa on The Crescent in Mivida with 620 m² BUA on an 890 m² plot, private heated pool, and internal elevator.",
      descriptionAr: "فيلا مستقلة فخمة في ميفيدا القاهرة الجديدة بمساحة مباني 620 م² وأرض 890 م² ومصعد وحمام سباحة.",
      propertyType: PropertyType.VILLA,
      listingIntent: ListingIntent.SALE,
      price: 48500000n * 100n, // 48.5M EGP
      bedrooms: 6,
      bathrooms: 7,
      areaSqm: 620.0,
      latitude: 30.0185,
      longitude: 31.495,
      areaId: mividaArea.id,
      featured: true,
      images: [
        { url: "/images/7.jpg", captionEn: "Villa exterior", isCover: true, order: 0 },
        { url: "/images/8.jpg", captionEn: "Private pool & garden", isCover: false, order: 1 },
      ],
      amenitySlugs: ["heated-pool", "elevator", "maids-room", "smart-home"],
    },
    {
      slug: "villette-sky-villa",
      titleEn: "Villette Sky Villa",
      titleAr: "سكاي فيلا فيليت سوديك",
      descriptionEn: "Duplex penthouse in Villette by SODIC featuring a private rooftop pool, pocket park frontage, and underground parking.",
      descriptionAr: "سكاي فيلا في مشروع فيليت من سوديك بالتجمع الخامس مع روف خاص ومسبح وموقف مغطى.",
      propertyType: PropertyType.DUPLEX,
      listingIntent: ListingIntent.SALE,
      price: 27200000n * 100n, // 27.2M EGP
      bedrooms: 4,
      bathrooms: 5,
      areaSqm: 390.0,
      latitude: 30.021,
      longitude: 31.505,
      areaId: goldenSquare.id,
      featured: false,
      images: [
        { url: "/images/6.jpg", captionEn: "Sky villa façade", isCover: true, order: 0 },
        { url: "/images/4.jpg", captionEn: "Rooftop deck", isCover: false, order: 1 },
      ],
      amenitySlugs: ["rooftop-pool", "central-park", "smart-home"],
    },
    {
      slug: "palm-court-signature-villa",
      titleEn: "Palm Court Signature Villa",
      titleAr: "فيلا بالم كورت سيجنتشر",
      descriptionEn: "Signature residence in Palm Hills New Cairo featuring lake frontage, private interior courtyard, and triple-height entrance foyer.",
      descriptionAr: "فيلا مميزة في بالم هيلز القاهرة الجديدة مع إطلالة على البحيرة وفناء داخلي خاص وبهو ثلاثي الارتفاع.",
      propertyType: PropertyType.VILLA,
      listingIntent: ListingIntent.SALE,
      price: 36000000n * 100n, // 36.0M EGP
      bedrooms: 5,
      bathrooms: 6,
      areaSqm: 480.0,
      latitude: 30.016,
      longitude: 31.491,
      areaId: goldenSquare.id,
      featured: true,
      images: [
        { url: "/images/4.jpg", captionEn: "Lake view", isCover: true, order: 0 },
        { url: "/images/11.jpg", captionEn: "Main residence façade", isCover: false, order: 1 },
      ],
      amenitySlugs: ["lake-frontage", "private-pool", "maids-room"],
    },
  ];

  for (const item of propertiesData) {
    const propId = uuidv7();
    const property = await prisma.property.upsert({
      where: { slug: item.slug },
      update: {
        status: PropertyStatus.PUBLISHED,
        publishedAt: new Date(),
        price: item.price,
      },
      create: {
        id: propId,
        slug: item.slug,
        titleEn: item.titleEn,
        titleAr: item.titleAr,
        descriptionEn: item.descriptionEn,
        descriptionAr: item.descriptionAr,
        propertyType: item.propertyType,
        listingIntent: item.listingIntent,
        price: item.price,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        areaSqm: item.areaSqm,
        status: PropertyStatus.PUBLISHED,
        publishedAt: new Date(),
        featured: item.featured,
        latitude: item.latitude,
        longitude: item.longitude,
        areaId: item.areaId,
        agentId: agentUser.id,
      },
    });

    // Delete old images & recreate
    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } });
    for (const img of item.images) {
      const resolved = resolveImage(img.url);
      await prisma.propertyImage.create({
        data: {
          id: uuidv7(),
          propertyId: property.id,
          url: resolved.url,
          cloudinaryPublicId: resolved.cloudinaryPublicId,
          captionEn: img.captionEn,
          isCover: img.isCover,
          order: img.order,
        },
      });
    }

    // Connect Amenities
    await prisma.propertyAmenity.deleteMany({ where: { propertyId: property.id } });
    for (const aSlug of item.amenitySlugs) {
      const aId = amenityMap.get(aSlug);
      if (aId) {
        await prisma.propertyAmenity.create({
          data: {
            propertyId: property.id,
            amenityId: aId,
          },
        });
      }
    }

    console.log(`  ✅ Seeded published property: ${item.titleEn} (${item.slug})`);
  }

  console.log("\n🎉 Database Catalog Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
