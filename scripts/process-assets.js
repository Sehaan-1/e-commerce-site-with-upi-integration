const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const brainDir = "C:\\Users\\INDIA TECHNOLOGY\\.gemini\\antigravity-ide\\brain\\c05e87f5-733b-4e1d-9463-1afa8054b0d8";
const publicDir = "c:\\Users\\INDIA TECHNOLOGY\\Documents\\e-commerce-site-with-upi-integration\\public";

async function run() {
  const iconsDir = path.join(publicDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  const productsDir = path.join(publicDir, 'products');
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
  }

  const productMappings = [
    { src: "brass_diya_1788525081378.jpg", dest: "products/brass-diya.jpg" },
    { src: "ceramic_mugs_1788525243255.jpg", dest: "products/ceramic-mugs.jpg" },
    { src: "cotton_throw_1788525283397.jpg", dest: "products/cotton-throw.jpg" },
    { src: "jute_basket_1788525455844.jpg", dest: "products/jute-basket.jpg" },
    { src: "soy_candle_1788525479177.jpg", dest: "products/soy-candle.jpg" },
    { src: "block_print_cushion_1788525636208.jpg", dest: "products/block-print-cushion.jpg" },
    { src: "copper_bottle_1788525667199.jpg", dest: "products/copper-bottle.jpg" },
    { src: "mango_wood_tray_1788525691954.jpg", dest: "products/mango-wood-tray.jpg" },
    { src: "kalpa_og_banner_1788525750622.jpg", dest: "og-image.jpg" },
  ];

  for (const item of productMappings) {
    const srcPath = path.join(brainDir, item.src);
    const destPath = path.join(publicDir, item.dest);
    if (!fs.existsSync(srcPath)) {
      console.error(`Missing source: ${srcPath}`);
      continue;
    }
    await sharp(srcPath).toFile(destPath);
    console.log(`Created: ${item.dest}`);
  }

  // Icons from brand icon
  const brandIconSrc = path.join(brainDir, "kalpa_brand_icon_1788525717504.jpg");
  if (fs.existsSync(brandIconSrc)) {
    await sharp(brandIconSrc).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
    console.log('Created: icons/icon-512.png');

    await sharp(brandIconSrc).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
    console.log('Created: icons/icon-192.png');

    await sharp(brandIconSrc).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('Created: icons/apple-touch-icon.png');

    // Also copy apple-touch-icon to public root if needed, or favicon.ico
    await sharp(brandIconSrc).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));
    console.log('Created: favicon.ico');
  } else {
    console.error('Missing brand icon source:', brandIconSrc);
  }

  console.log('Asset processing completed successfully.');
}

run().catch(console.error);
