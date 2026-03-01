import { PrismaClient, Role, OrderStatus, FieldType, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ==========================================
  // 1. Create Admin User
  // ==========================================
  const adminPhone = process.env.ADMIN_PHONE || '9876543210';

  const adminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      phone: adminPhone,
      name: 'Admin User',
      email: 'admin@store.com',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', adminUser.phone);

  // ==========================================
  // 2. Create Default Settings
  // ==========================================
  const settings = [
    { key: 'SITE_NAME', value: 'My Store', type: 'string', isPublic: true },
    { key: 'SUPPORT_PHONE', value: '+91 9876543210', type: 'string', isPublic: true },
    { key: 'SUPPORT_EMAIL', value: 'support@store.com', type: 'string', isPublic: true },
    { key: 'DEFAULT_DELIVERY_CHARGE', value: '60', type: 'number', isPublic: true },
    { key: 'FREE_SHIPPING_THRESHOLD', value: '500', type: 'number', isPublic: true },
    { key: 'ENABLE_COD', value: 'true', type: 'boolean', isPublic: true },
    { key: 'ENABLE_ONLINE_PAYMENT', value: 'true', type: 'boolean', isPublic: true },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Settings created:', settings.length);

  // ==========================================
  // 3. Create Categories
  // ==========================================
  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices' },
    { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories' },
    { name: 'Home & Living', slug: 'home-living', description: 'Home essentials' },
    { name: 'Toys', slug: 'toys', description: 'Toys and games' },
    { name: 'Sports', slug: 'sports', description: 'Sports equipment' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
    createdCategories.push(category);
  }
  console.log('✅ Categories created:', createdCategories.length);

  // ==========================================
  // 4. Create Catalogs with Items
  // ==========================================

  // Catalog 1: T-Shirt (with size/color variants)
  const tshirtCatalog = await prisma.catalog.upsert({
    where: { slug: 'premium-cotton-tshirt' },
    update: {},
    create: {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      description: '100% premium cotton t-shirt with comfortable fit. Perfect for everyday wear.',
      shortDesc: 'Premium cotton comfort tee',
      bullets: JSON.stringify(['100% combed cotton', 'Pre-shrunk fabric', 'Reinforced stitching', 'Machine washable']),
      extraData: JSON.stringify({ fabric: 'Cotton', care: 'Machine wash cold', origin: 'India' }),
      imageUrl: 'https://placehold.co/600x600/blue/white?text=T-Shirt',
      isActive: true,
      categories: {
        create: { categoryId: createdCategories[1].id }, // Fashion
      },
    },
  });

  // Create items for tshirt (size/color variants)
  const tshirtItems = [
    { size: 'S', color: 'Black', price: 499, stock: 50, skuCode: 'TSH-BLK-S' },
    { size: 'M', color: 'Black', price: 499, stock: 75, skuCode: 'TSH-BLK-M' },
    { size: 'L', color: 'Black', price: 499, stock: 60, skuCode: 'TSH-BLK-L' },
    { size: 'S', color: 'White', price: 499, stock: 40, skuCode: 'TSH-WHT-S' },
    { size: 'M', color: 'White', price: 499, stock: 80, skuCode: 'TSH-WHT-M' },
    { size: 'L', color: 'White', price: 499, stock: 55, skuCode: 'TSH-WHT-L' },
  ];

  for (const item of tshirtItems) {
    await prisma.item.upsert({
      where: { skuCode: item.skuCode },
      update: {},
      create: {
        ...item,
        catalogId: tshirtCatalog.id,
        isActive: true,
      },
    });
  }
  console.log('✅ T-Shirt catalog created with', tshirtItems.length, 'variants');

  // Catalog 2: Wireless Earbuds (no variants)
  const earbudsCatalog = await prisma.catalog.upsert({
    where: { slug: 'wireless-bluetooth-earbuds' },
    update: {},
    create: {
      name: 'Wireless Bluetooth Earbuds',
      slug: 'wireless-bluetooth-earbuds',
      description: 'Premium wireless earbuds with active noise cancellation and 30-hour battery life.',
      shortDesc: 'ANC wireless earbuds with 30hr battery',
      bullets: JSON.stringify(['Active Noise Cancellation', '30-hour battery life', 'IPX5 water resistant', 'Touch controls']),
      extraData: JSON.stringify({ warranty: '1 year', connectivity: 'Bluetooth 5.3', range: '10 meters' }),
      imageUrl: 'https://placehold.co/600x600/black/white?text=Earbuds',
      isActive: true,
      categories: {
        create: { categoryId: createdCategories[0].id }, // Electronics
      },
    },
  });

  // Single item for earbuds (no size/color)
  await prisma.item.upsert({
    where: { skuCode: 'EARBUDS-001' },
    update: {},
    create: {
      catalogId: earbudsCatalog.id,
      price: 2499,
      discount: 500,
      stock: 100,
      skuCode: 'EARBUDS-001',
      isActive: true,
    },
  });
  console.log('✅ Earbuds catalog created (single item)');

  // Catalog 3: Toy Car (no variants)
  const toyCarCatalog = await prisma.catalog.upsert({
    where: { slug: 'remote-control-car' },
    update: {},
    create: {
      name: 'Remote Control Racing Car',
      slug: 'remote-control-car',
      description: 'High-speed remote control racing car with rechargeable battery.',
      shortDesc: 'RC racing car with rechargeable battery',
      bullets: JSON.stringify(['Speed up to 20km/h', '2.4GHz remote control', 'Rechargeable battery', 'Durable ABS plastic']),
      extraData: JSON.stringify({ ageGroup: '6+', battery: 'Li-ion 7.4V', playTime: '30 minutes' }),
      imageUrl: 'https://placehold.co/600x600/red/white?text=RC+Car',
      isActive: true,
      categories: {
        create: { categoryId: createdCategories[3].id }, // Toys
      },
    },
  });

  await prisma.item.upsert({
    where: { skuCode: 'TOY-CAR-001' },
    update: {},
    create: {
      catalogId: toyCarCatalog.id,
      price: 1299,
      stock: 75,
      skuCode: 'TOY-CAR-001',
      isActive: true,
    },
  });
  console.log('✅ Toy Car catalog created (single item)');

  // Catalog 4: Running Shoes (with size variants only)
  const shoesCatalog = await prisma.catalog.upsert({
    where: { slug: 'running-shoes-pro' },
    update: {},
    create: {
      name: 'Running Shoes Pro',
      slug: 'running-shoes-pro',
      description: 'Lightweight running shoes with cushioned sole for maximum comfort.',
      shortDesc: 'Lightweight cushioned running shoes',
      bullets: JSON.stringify(['Breathable mesh upper', 'Cushioned midsole', 'Non-slip rubber outsole', 'Reflective details']),
      extraData: JSON.stringify({ material: 'Mesh/Synthetic', weight: '250g', bestFor: 'Road running' }),
      imageUrl: 'https://placehold.co/600x600/orange/white?text=Shoes',
      isActive: true,
      categories: {
        create: [
          { categoryId: createdCategories[1].id }, // Fashion
          { categoryId: createdCategories[4].id }, // Sports
        ],
      },
    },
  });

  const shoeSizes = ['7', '8', '9', '10', '11'];
  for (const size of shoeSizes) {
    await prisma.item.upsert({
      where: { skuCode: `SHOE-BLK-${size}` },
      update: {},
      create: {
        catalogId: shoesCatalog.id,
        size,
        price: 1999,
        discount: 200,
        stock: 30,
        skuCode: `SHOE-BLK-${size}`,
        isActive: true,
      },
    });
  }
  console.log('✅ Running Shoes catalog created with', shoeSizes.length, 'size variants');

  // Catalog 5: Smart Watch (no variants)
  const watchCatalog = await prisma.catalog.upsert({
    where: { slug: 'smart-watch-pro' },
    update: {},
    create: {
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Advanced fitness tracking, heart rate monitor, and GPS enabled smart watch.',
      shortDesc: 'Fitness tracking smart watch with GPS',
      bullets: JSON.stringify(['Heart rate monitoring', 'GPS tracking', '7-day battery', 'Water resistant 5ATM']),
      extraData: JSON.stringify({ display: 'AMOLED 1.4"', sensors: 'HR, SpO2, Accelerometer', compatibility: 'Android/iOS' }),
      imageUrl: 'https://placehold.co/600x600/green/white?text=Watch',
      isActive: true,
      categories: {
        create: { categoryId: createdCategories[0].id }, // Electronics
      },
    },
  });

  await prisma.item.upsert({
    where: { skuCode: 'WATCH-PRO-001' },
    update: {},
    create: {
      catalogId: watchCatalog.id,
      price: 4999,
      stock: 50,
      skuCode: 'WATCH-PRO-001',
      isActive: true,
    },
  });
  console.log('✅ Smart Watch catalog created (single item)');

  // ==========================================
  // 5. Create Sample Coupon
  // ==========================================
  const coupon = await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      discountType: DiscountType.PERCENT,
      discountValue: 20,
      maxDiscount: 500,
      minOrderAmount: 500,
      usageLimit: 1000,
      isActive: true,
    },
  });
  console.log('✅ Coupon created:', coupon.code);

  // ==========================================
  // 6. Create Contact Form
  // ==========================================
  const contactForm = await prisma.form.upsert({
    where: { slug: 'contact-us' },
    update: {},
    create: {
      name: 'Contact Us',
      slug: 'contact-us',
      description: 'Get in touch with us',
      submitText: 'Send Message',
      successMessage: 'Thank you for contacting us. We will get back to you soon!',
      isActive: true,
      fields: {
        create: [
          {
            label: 'Full Name',
            fieldKey: 'full_name',
            fieldType: FieldType.TEXT,
            isRequired: true,
            placeholder: 'Enter your full name',
            sortOrder: 1,
          },
          {
            label: 'Email Address',
            fieldKey: 'email',
            fieldType: FieldType.EMAIL,
            isRequired: true,
            placeholder: 'Enter your email',
            sortOrder: 2,
          },
          {
            label: 'Phone Number',
            fieldKey: 'phone',
            fieldType: FieldType.PHONE,
            isRequired: false,
            placeholder: 'Enter your phone number',
            sortOrder: 3,
          },
          {
            label: 'Subject',
            fieldKey: 'subject',
            fieldType: FieldType.SELECT,
            isRequired: true,
            options: ['General Inquiry', 'Order Issue', 'Product Question', 'Feedback'],
            sortOrder: 4,
          },
          {
            label: 'Message',
            fieldKey: 'message',
            fieldType: FieldType.TEXTAREA,
            isRequired: true,
            placeholder: 'Enter your message',
            sortOrder: 5,
          },
        ],
      },
    },
  });
  console.log('✅ Form created:', contactForm.name);

  console.log('\n✨ Database seed completed successfully!');
  console.log(`\n📱 Admin login: ${adminPhone}`);
  console.log(`📦 Catalogs created: 5`);
  console.log(`🎁 Total items created: ${tshirtItems.length + 1 + 1 + shoeSizes.length + 1}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
