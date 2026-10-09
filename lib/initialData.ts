import { MuseumHall, MuseumExhibit, Product, Article, PixelConfig, SiteContentSettings, Order } from '@/types';

export const INITIAL_HALLS: MuseumHall[] = [
  {
    id: 'hall-01',
    slug: 'legend-hall',
    title: 'ห้องตำนานและเทพปกรณัมแห่งผืนป่า',
    subtitle: 'Amanita Muscaria: The World Legendary Mushroom',
    description: 'เห็ดสีแดงที่มีจุดสีขาว หนึ่งในเห็ดที่มีชื่อเสียงที่สุดในโลก มักขึ้นตามธรรมชาติเคียงข้างต้นสนและต้นเบิร์ช เป็นสัญลักษณ์แห่งเวทมนตร์และนิทานพื้นบ้านทั่วยุโรปและเอเชียเหนือ',
    cover_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    sort_order: 1,
    status: 'published',
  },
  {
    id: 'hall-02',
    slug: 'history-hall',
    title: 'ห้องตำนานหมอผีไซบีเรียและดินแดนหิมะ',
    subtitle: 'The Legend of the Siberian Shaman & The Great Raven',
    description: 'เรื่องเล่าจากดินแดนหิมะอันกว้างใหญ่ หมอผีในฐานะผู้นำทางจิตวิญญาณ ผู้รักษา และตำนานอีกายักษ์แห่งชนเผ่าคอร์ยัคโบราณที่เชื่อมโยงกับเห็ดวิเศษและการเดินทางข้ามมิติ',
    cover_image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    sort_order: 2,
    status: 'published',
  },
  {
    id: 'hall-03',
    slug: 'science-hall',
    title: 'ห้องชีวเคมีและปฏิกิริยา Decarboxylation',
    subtitle: 'Muscimol vs Ibotenic Acid: Molecular Dynamics',
    description: 'การศึกษาสารสำคัญ Muscimol และ Ibotenic Acid กลไกการเปลี่ยนแปลงทางเคมีด้วยความร้อน การออกฤทธิ์ต่อตัวรับ GABA-A ในระบบประสาทส่วนกลาง และความแตกต่างกับไซโลไซบิน',
    cover_image_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
    sort_order: 3,
    status: 'published',
  },
  {
    id: 'hall-04',
    slug: 'dream-hall',
    title: 'มิติโลกแห่งความฝันและจิตใต้สำนึก',
    subtitle: 'Altered Consciousness & Lucidity Dimensions',
    description: 'มิติแห่งการผ่อนคลายลึกและภวังค์ความฝันอันแจ่มชัด (Lucid Dreaming) การทำงานร่วมกับสารสื่อประสาทเพื่อฟื้นฟูสภาวะจิตใจและผ่อนคลายความตึงเครียดตามธรรมชาติ',
    cover_image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    sort_order: 4,
    status: 'published',
  },
];

export const INITIAL_EXHIBITS: MuseumExhibit[] = [
  {
    id: 'exhibit-01',
    hall_id: 'hall-01',
    slug: 'red-cap-symbolism',
    title: 'หมวกสีแดงและเกล็ดสีขาว: สัญลักษณ์สากลแห่งเทพนิยาย',
    summary: 'สัญลักษณ์ทางวัฒนธรรมที่มีอิทธิพลต่อวรรณกรรม นิทานอลิซในแดนมหัศจรรย์ และการออกแบบตัวละครร่วมสมัย',
    sort_order: 1,
    status: 'published',
    content_blocks: [
      { id: 'b1', type: 'heading', data: { level: 2, text: 'ต้นกำเนิดแห่งสีสันในป่าสนโบราณ' } },
      { id: 'b2', type: 'text', data: { content: 'เห็ด Amanita Muscaria มีหมวกสีแดงสดประดับด้วยจุดสีขาวซึ่งเป็นเศษซากของเยื่อหุ้มดอก (Universal Veil) มักเจริญเติบโตร่วมกับระบบรากของต้นสน (Pine) และต้นเบิร์ช (Birch) ในรูปแบบการพึ่งพาอาศัยกัน (Mycorrhizal symbiosis) ก่อให้เกิดแรงบันดาลใจในงานศิลปะและวรรณกรรมทั่วโลก' } },
      { id: 'b3', type: 'quote', data: { quote: 'ธรรมชาติสร้างสรรค์สีสันอันโดดเด่นเพื่อเตือนและดึงดูด เป็นสะพานเชื่อมระหว่างโลกความจริงและโลกจินตนาการ', author: 'หอจดหมายเหตุนิทานพื้นบ้าน' } }
    ]
  },
  {
    id: 'exhibit-02',
    hall_id: 'hall-02',
    slug: 'siberian-shaman-raven',
    title: 'พิธีกรรมหมอผีไซบีเรีย และตำนานอีกาผงาดฟ้า',
    summary: 'เรื่องเล่าโบราณของชนเผ่า Koryak และ Chukchi ในไซบีเรีย ที่เชื่อมโยงเห็ดศักดิ์สิทธิ์กับอีกายักษ์และขบวนกวางเรนเดียร์',
    sort_order: 1,
    status: 'published',
    content_blocks: [
      { id: 'b4', type: 'heading', data: { level: 2, text: 'อีกายักษ์ (Great Raven) และหยดน้ำลายศักดิ์สิทธิ์' } },
      { id: 'b5', type: 'text', data: { content: 'ตามตำนานของชนเผ่าคอร์ยัค (Koryak) อีกายักษ์ได้บินข้ามดินแดนทุนดราอันหนาวเหน็บ เทพเจ้าแห่งผืนฟ้าได้ประทานหยดน้ำลายลงสู่ผืนดินกลายเป็นเห็ดสีแดงสด เมื่ออีกายักษ์กินเข้าไปก็ได้รับพละกำลังมหาศาลจนสามารถยกวาฬขึ้นจากมหาสมุทรได้ หมอผีจึงใช้เห็ดนี้ในการทำสมาธิและรักษาผู้คน' } },
      { id: 'b6', type: 'callout', data: { title: 'จุดกำเนิดซานตาคลอส', message: 'หมอผีไซบีเรียสวมชุดคลุมสีแดงขลิบขาว เข้าบ้านทางปล่องไฟในฤดูหนาว และมอบเห็ดตากแห้งที่แขวนไว้บนต้นสน ซึ่งเป็นรากเหง้าของตำนานซานตาคลอสและกวางเรนเดียร์เหาะ' } }
    ]
  },
  {
    id: 'exhibit-03',
    hall_id: 'hall-03',
    slug: 'muscimol-ibotenic-chemistry',
    title: 'ชีวเคมีของ Muscimol และ Ibotenic Acid',
    summary: 'เปรียบเทียบโครงสร้างโมเลกุล การสลายตัวด้วยความร้อน (Decarboxylation) และการจับกับตัวรับ GABA-A',
    sort_order: 1,
    status: 'published',
    content_blocks: [
      { id: 'b7', type: 'heading', data: { level: 2, text: 'ปฏิกิริยา Decarboxylation' } },
      { id: 'b8', type: 'text', data: { content: 'ในเห็ดสด สารประกอบหลักคือ Ibotenic Acid ซึ่งมีคุณสมบัติกระตุ้นระบบประสาทผ่านตัวรับ NMDA เมื่อผ่านกระบวนการตากแห้งหรือความร้อนในสภาวะควบคุม จะเกิดการหลุดของหมู่คาร์บอกซิล (Decarboxylation) เปลี่ยนรูปกลายเป็น Muscimol ซึ่งเป็นสารที่ออกฤทธิ์สงบประสาทผ่านตัวรับ GABA-A' } },
      { id: 'b9', type: 'callout', data: { title: 'กลไก GABA-A เทียบกับ Serotonin', message: 'ต่างจากเห็ดขี้ควาย (Psilocybin) ที่ออกฤทธิ์ต่อตัวรับ Serotonin 5-HT2A ก่อให้เกิดภาพหลอน สาร Muscimol ออกฤทธิ์ต่อระบบ GABA เช่นเดียวกับสารสื่อประสาทที่ช่วยผ่อนคลายและควบคุมการนอนหลับ' } }
    ]
  },
  {
    id: 'exhibit-04',
    hall_id: 'hall-04',
    slug: 'lucid-dreams-restoration',
    title: 'ภวังค์แห่งความฝันแจ่มชัด (Lucid Dreaming)',
    summary: 'การศึกษาทางจิตวิทยาเกี่ยวกับมิติความฝัน การนอนหลับระยะ REM และการฟื้นฟูสภาวะจิตใจ',
    sort_order: 1,
    status: 'published',
    content_blocks: [
      { id: 'b10', type: 'heading', data: { level: 2, text: 'ประตูสู่จิตใต้สำนึก' } },
      { id: 'b11', type: 'text', data: { content: 'รายงานทางชาติพันธุ์วิทยาและวิทยาศาสตร์การนอนหลับพบว่า สาร Muscimol ช่วยเสริมสร้างภาวะนอนหลับลึกและกระตุ้นการฝันที่คมชัด (Lucid Dreaming) ช่วยให้จิตใจได้พักผ่อนและเรียบเรียงความคิดอย่างสงบ' } }
    ]
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    slug: 'amanita-dried-caps-grade-a',
    name: 'ดอกเห็ด Amanita Muscaria อบแห้งคัดพิเศษ (Closed Cap Specimen)',
    botanical_name: 'Amanita muscaria (L.) Lam.',
    origin_region: 'เขตป่าสนไซบีเรีย / ลัตเวียตอนเหนือ',
    description: 'ตัวอย่างดอกเห็ดแห้งคัดสรรพิเศษสำหรับงานสะสมพฤกษศาสตร์ ดอกสมบูรณ์ สีแดงเข้มสดใส ผ่านกระบวนการลดความชื้นมาตรฐานห้องทดลอง',
    price: 390,
    hero_image_url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop',
    variants: [
      { size: '3g', price: 390, in_stock: true, note: 'ตัวอย่างดอกเดี่ยวขนาดกะทัดรัด (Intensity 2/5)' },
      { size: '5g', price: 590, in_stock: true, note: 'ขนาดมาตรฐานยอดนิยม (Intensity 3/5)' },
      { size: '10g', price: 990, in_stock: true, note: 'ชุดสะสมเปรียบเทียบ (Intensity 4/5)' },
      { size: '15g', price: 1450, in_stock: true, note: 'เกรดพิพิธภัณฑ์สูงสุด (Intensity 5/5)' }
    ],
    line_oa_url: 'https://line.me/R/ti/p/@amanitathailand',
    facebook_url: 'https://facebook.com/amanitathailand',
    shopee_url: 'https://shopee.co.th/amanitathailand',
    disclaimer: 'จัดแสดงและจำหน่ายเพื่อวัตถุประสงค์ในการสะสม การศึกษาทางอนุกรมวิธาน และการวิจัยทางพฤกษศาสตร์เท่านั้น ไม่ใช่ผลิตภัณฑ์อาหารหรือยา',
    content_blocks: [],
    sort_order: 1,
    status: 'published',
  },
  {
    id: 'prod-02',
    slug: 'amanita-open-cap-specimen',
    name: 'ดอกเห็ด Amanita Muscaria หมวกเปิดสมบูรณ์ (Open Cap Specimen)',
    botanical_name: 'Amanita muscaria var. Guessowii',
    origin_region: 'เขตป่าเบิร์ชแถบซับอัลไพน์',
    description: 'ตัวอย่างสัณฐานวิทยาดอกบานเต็มที่ เผยให้เห็นครีบใต้หมวก (Gills) และวงแหวนบนก้าน (Annulus) อย่างประณีต นิยมนำไปจัดแสดงในตู้โชว์พิพิธภัณฑ์ธรรมชาติวิทยา',
    price: 490,
    hero_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    variants: [
      { size: '5g', price: 490, in_stock: true, note: 'หมวกบานเต็มที่สีส้มทอง' },
      { size: '10g', price: 890, in_stock: true, note: 'คู่ดอกสมบูรณ์' }
    ],
    line_oa_url: 'https://line.me/R/ti/p/@amanitathailand',
    facebook_url: 'https://facebook.com/amanitathailand',
    shopee_url: 'https://shopee.co.th/amanitathailand',
    disclaimer: 'สำหรับศึกษา วิจัยทางพฤกษศาสตร์ หรือสะสมเป็นตัวอย่างพิพิธภัณฑ์เท่านั้น',
    content_blocks: [],
    sort_order: 2,
    status: 'published',
  },
  {
    id: 'prod-03',
    slug: 'amanita-crushed-herbarium',
    name: 'ตัวอย่างเกล็ดเห็ดบดสำหรับศึกษาใต้กล้องจุลทรรศน์ (Lab Crushed)',
    botanical_name: 'Amanita muscaria var. Formosa',
    origin_region: 'Highland Coniferous Forests',
    description: 'ชิ้นส่วนหมวกเห็ดบดหยาบเกรดห้องปฏิบัติการ สำหรับการเตรียมสไลด์ตัวอย่างพฤกษศาสตร์และการสกัดรงควัตถุธรรมชาติ Muscaflavin เพื่อการวิจัยทางเคมีชีววิทยา',
    price: 320,
    hero_image_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
    variants: [
      { size: '10g', price: 320, in_stock: true, note: 'เกล็ดบดหยาบสำหรับเตรียมสไลด์' },
      { size: '25g', price: 690, in_stock: true, note: 'ชุดทดสอบแล็บขนาดประหยัด' }
    ],
    line_oa_url: 'https://line.me/R/ti/p/@amanitathailand',
    facebook_url: 'https://facebook.com/amanitathailand',
    shopee_url: 'https://shopee.co.th/amanitathailand',
    disclaimer: 'จัดเก็บในที่แห้งและเย็น เพื่อการสะสมและวิจัยเท่านั้น',
    content_blocks: [],
    sort_order: 3,
    status: 'published',
  },
  {
    id: 'prod-04',
    slug: 'amanita-resin-display-cube',
    name: 'ตัวอย่างดอกเห็ดสตาฟแห้งในบล็อกเรซินใส (Botanical Resin Cube)',
    botanical_name: 'Amanita muscaria in Optical Resin',
    origin_region: 'Chiang Mai Botanical Workshop',
    description: 'ชิ้นงานตัวอย่างพฤกษศาสตร์ถาวร หล่อขึ้นรูปในบล็อกเรซินใสพิเศษความโปร่งแสงสูง ป้องกันความชื้นและอากาศคงสภาพสีสันและโครงสร้างได้ยาวนานหลายสิบปี',
    price: 1290,
    hero_image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    variants: [
      { size: 'Standard Cube', price: 1290, in_stock: true, note: 'ขนาด 6x6x6 cm พร้อมฐานไม้ไฟ LED' },
      { size: 'Masterpiece 8cm', price: 1890, in_stock: true, note: 'บล็อกขนาดใหญ่ 8x8x8 cm คัดดอกพิเศษ' }
    ],
    line_oa_url: 'https://line.me/R/ti/p/@amanitathailand',
    facebook_url: 'https://facebook.com/amanitathailand',
    shopee_url: 'https://shopee.co.th/amanitathailand',
    disclaimer: 'เพื่อการสะสมทางอนุกรมวิธานและการจัดแสดงในพิพิธภัณฑ์เท่านั้น',
    content_blocks: [],
    sort_order: 4,
    status: 'published',
  },
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-01',
    slug: 'siberian-shamanism-and-amanita',
    title: 'หมอผีไซบีเรียกับเห็ดศักดิ์สิทธิ์: รากเหง้าแห่งความเชื่อดั้งเดิม',
    excerpt: 'สำรวจคติชนวิทยาของชนเผ่าพื้นเมืองในทวีปเอเชียตอนเหนือ ผู้ใช้เห็ดสีแดงเป็นสะพานเชื่อมสู่ภพภูมิวิญญาณ',
    featured_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    reading_time_minutes: 6,
    tags: ['ประวัติศาสตร์', 'คติชนวิทยา', 'ไซบีเรีย'],
    status: 'published',
    created_at: new Date().toISOString(),
    content_blocks: [
      { id: 'ac1', type: 'heading', data: { level: 2, text: 'ความเชื่อดั้งเดิมใต้แสงเหนือแห่งไซบีเรีย' } },
      { id: 'ac2', type: 'text', data: { content: 'ในดินแดนที่หนาวเย็นที่สุดในโลก หมอผีทำหน้าที่เป็นสื่อกลางระหว่างมนุษย์และวิญญาณแห่งธรรมชาติ สีแดงและขาวของเห็ดที่เติบโตใต้ต้นสนกลายเป็นแรงบันดาลใจในนิทานพื้นบ้าน กวางเรนเดียร์ และการเดินทางข้ามภพภูมิ' } },
      { id: 'ac3', type: 'quote', data: { quote: 'จากพิธีกรรมโบราณ สู่เทพนิยายวิกตอเรีย และกลายเป็นสัญลักษณ์สากลในวรรณกรรมแฟนตาซีปัจจุบัน', author: 'เส้นทางแห่งตำนาน Amanita' } }
    ]
  },
  {
    id: 'art-02',
    slug: 'muscimol-vs-psilocybin-pharmacology',
    title: 'Muscimol vs Psilocybin: การเปรียบเทียบกลไกทางประสาทวิทยา',
    excerpt: 'เจาะลึกความแตกต่างระหว่างระบบ GABA-A ของ Amanita Muscaria และระบบ Serotonin 5-HT2A ของเห็ดกลุ่ม Psilocybe',
    featured_image_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
    reading_time_minutes: 8,
    tags: ['ชีวเคมี', 'เภสัชวิทยา', 'ประสาทวิทยา'],
    status: 'published',
    created_at: new Date().toISOString(),
    content_blocks: [
      { id: 'ac4', type: 'heading', data: { level: 2, text: 'กลไก GABA-A: ความสงบและมิติแห่งความฝัน' } },
      { id: 'ac5', type: 'text', data: { content: 'Muscimol ไม่ใช่สารกลุ่ม Classic Psychedelics เหมือน Psilocybin แต่เป็น GABA-A Receptor Agonist ที่ทรงพลัง ทำหน้าที่ส่งสัญญาณยับยั้งในสมอง ทำให้กล้ามเนื้อผ่อนคลายและนำไปสู่สภาวะความฝันแจ่มชัดโดยปราศจากการรบกวนระบบ Serotonin' } }
    ]
  },
  {
    id: 'art-03',
    slug: 'botanical-drying-and-decarboxylation',
    title: 'วิทยาศาสตร์แห่งการอบแห้งและปฏิกิริยา Decarboxylation',
    excerpt: 'ทำความเข้าใจกระบวนการทางอุณหพลศาสตร์ที่เปลี่ยน Ibotenic Acid ให้กลายเป็น Muscimol ที่เสถียร',
    featured_image_url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop',
    reading_time_minutes: 5,
    tags: ['วิทยาศาสตร์', 'พฤกษศาสตร์', 'การทดลอง'],
    status: 'published',
    created_at: new Date().toISOString(),
    content_blocks: [
      { id: 'ac6', type: 'heading', data: { level: 2, text: 'อุณหภูมิและเวลาในการแปรสภาพโมเลกุล' } },
      { id: 'ac7', type: 'text', data: { content: 'การศึกษาในห้องปฏิบัติการยืนยันว่าการให้ความร้อนที่อุณหภูมิ 70-80 องศาเซลเซียส หรือการตากแห้งอย่างสมบูรณ์ จะกระตุ้นให้เกิด Decarboxylation สลายหมู่ carboxyl ส่งผลให้ปริมาณ Ibotenic Acid ลดลงและได้สาร Muscimol ที่คงตัวสูง' } }
    ]
  }
];

export const INITIAL_PIXELS: PixelConfig[] = [
  { id: 'px-1', provider: 'meta', pixel_id: '987654321012345', is_active: true },
  { id: 'px-2', provider: 'tiktok', pixel_id: 'C987654321012345678', is_active: true },
  { id: 'px-3', provider: 'ga4', pixel_id: 'G-AMANITA001', is_active: true },
  { id: 'px-4', provider: 'gtm', pixel_id: 'GTM-AMANITA7', is_active: true },
  { id: 'px-5', provider: 'clarity', pixel_id: 'clarity_amanita_prod', is_active: true },
];

export const INITIAL_ADMIN_SETTINGS = {
  line_channel_id: '2006789012',
  line_channel_access_token: '',
  line_channel_secret: '',
  line_admin_user_id: '',
  line_notify_token: '',
  promptpay_number: '0909964514',
  promptpay_name: 'นายวันชนะ',
  promptpay_bank: 'ธนาคารกสิกรไทย (K-Bank)',
};

export const INITIAL_SITE_CONTENT: SiteContentSettings = {
  site_title: 'Amanita Thailand Digital Museum',
  site_subtitle: 'พิพิธภัณฑ์ดิจิทัลแห่งเห็ดศักดิ์สิทธิ์และการศึกษาทางพฤกษศาสตร์',
  portal_button_text: 'สัมผัสดอกเห็ดเพื่อเปิดประตูมิติพิพิธภัณฑ์',
  museum_title: 'ห้องจัดแสดงนิทรรศการดิจิทัล',
  museum_subtitle: 'Digital Sanctuary & Botanical Archive',
  museum_description: 'เลือกเดินทางผ่านแต่ละห้องเพื่อศึกษาตำนานโบราณ คัมภีร์ประวัติศาสตร์ ชีวเคมีของสารมัสซิโมล และโลกแห่งมโนทัศน์',
  products_title: 'ตัวอย่างทางพฤกษศาสตร์และการสั่งซื้อ',
  products_subtitle: 'Botanical Specimen Showcase & Direct PromptPay Checkout',
  products_description: 'นำเสนอข้อมูลเพื่อการศึกษาและสะสม สามารถสั่งซื้อพร้อมโอนชำระผ่าน PromptPay QR และแนบสลิปได้ทันที',
  articles_title: 'คลังบทความวิจัยและประวัติศาสตร์',
  articles_subtitle: 'Mycological & Anthropological Studies',
  articles_description: 'รวบรวมข้อเท็จจริงทางวิทยาศาสตร์ ชีวเคมี และการศึกษาเชิงมานุษยวิทยาเกี่ยวกับ Amanita Muscaria',
  footer_disclaimer: 'จัดแสดงและรวบรวมเพื่อวัตถุประสงค์ในการศึกษาทางพฤกษศาสตร์ อนุกรมวิธาน และคติชนวิทยาเท่านั้น ไม่ใช่เพื่อการบริโภคหรือเป็นยาเสพติด',
  promptpay_number: '0909964514',
  promptpay_name: 'นายวันชนะ',
  promptpay_bank: 'ธนาคารกสิกรไทย (K-Bank)',
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1',
    order_number: 'AMN-261006-8941',
    customer_name: 'คุณสมชาย วิจิตรศิลป์',
    customer_phone: '0812345678',
    customer_email: 'somchai@example.com',
    shipping_address: '123/45 หมู่บ้านพฤกษ์ลดา ถนนรังสิต-นครนายก ตำบลบึงยี่โถ อำเภอธัญบุรี จังหวัดปทุมธานี 12130',
    product_id: 'prod-01',
    product_name: 'ดอกเห็ด Amanita Muscaria อบแห้งคัดพิเศษ (Closed Cap Specimen)',
    variant_size: '5g',
    quantity: 1,
    total_price: 590,
    slip_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop',
    status: 'paid',
    admin_note: 'ตรวจสอบสลิปเรียบร้อย จัดส่งรอบเช้า',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'ord-2',
    order_number: 'AMN-261006-7712',
    customer_name: 'คุณพิมลพรรณ สุขเกษม',
    customer_phone: '0898765432',
    customer_email: 'pimonpan@example.com',
    shipping_address: '99/8 อาคารสุขุมวิทการ์เด้นท์ ซอยสุขุมวิท 39 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
    product_id: 'prod-04',
    product_name: 'ตัวอย่างดอกเห็ดสตาฟแห้งในบล็อกเรซินใส (Botanical Resin Cube)',
    variant_size: 'Standard Cube',
    quantity: 1,
    total_price: 1290,
    slip_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop',
    status: 'pending',
    admin_note: 'รอยืนยันยอดเงินเข้าบัญชีกสิกรไทย',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  }
];

export const INITIAL_MEDIA = [
  {
    id: 'm1',
    file_name: 'infographic_01_amanita_legend.jpg',
    storage_path: 'infographic_01_amanita_legend.jpg',
    public_url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop',
    mime_type: 'image/jpeg',
    file_size_bytes: 540000,
  },
  {
    id: 'm2',
    file_name: 'infographic_02_siberian_shaman.jpg',
    storage_path: 'infographic_02_siberian_shaman.jpg',
    public_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    mime_type: 'image/jpeg',
    file_size_bytes: 610000,
  },
  {
    id: 'm3',
    file_name: 'infographic_03_muscimol_ibotenic.jpg',
    storage_path: 'infographic_03_muscimol_ibotenic.jpg',
    public_url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop',
    mime_type: 'image/jpeg',
    file_size_bytes: 480000,
  },
  {
    id: 'm4',
    file_name: 'infographic_07_amanita_vs_psilocybin.jpg',
    storage_path: 'infographic_07_amanita_vs_psilocybin.jpg',
    public_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    mime_type: 'image/jpeg',
    file_size_bytes: 590000,
  },
];
