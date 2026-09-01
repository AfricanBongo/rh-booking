import type { Core } from '@strapi/strapi';

const seedData = {
  conferences: [
    {
      name: 'Royal Ladies Camp North America Retreat 2026',
      slug: 'royalladies2026',
      description: `## Royal Ladies Camp Retreat 2026\n\nRoyal Ladies International Ministry is the Women's Ministry of Royalhouse Chapel International, founded in 1994 by Rev. Mrs. Rita Korankye Ankrah. Join us from November 26-28, 2026, for a weekend filled with power, presence, and praise.\n\n### What to Expect\n\n- **Worship & Prayer** - Intimate corporate worship and guided prayer sessions\n- **Keynote Messages** - Apostle Mrs. Rita Korankye Ankrah and guest women ministers\n- **Panel Discussions** - Real conversations on marriage, motherhood, career, health, and spiritual growth\n- **Spa & Self-Care Session** - An afternoon dedicated to rest, wellness, and restoration\n- **Gala Dinner** - An elegant evening of celebration, awards, and fellowship\n\n### Payment Information\n\n2 people in a room: $295 each | 1 person in a room: $450 each | 4 people in a room: $200 each`,
      start_date: '2026-11-26T21:00:00.000Z',
      end_date: '2026-11-28T17:00:00.000Z',
      check_in: '2026-11-26T21:00:00.000Z',
      check_out: '2026-11-28T17:00:00.000Z',
      payment_deadline: '2026-10-15T15:59:00.000Z',
      location: 'Washington Dulles Airport Marriott',
      is_active: true,
      publishedAt: new Date().toISOString(),
    },
  ],
  roomTypes: [
    {
      type: 'private',
      price: 45000,
      total_available: 10,
      description: 'Private room for solo attendees. Full privacy with a king bed and all standard hotel amenities.',
      publishedAt: new Date().toISOString(),
    },
    {
      type: 'shared-2',
      price: 29500,
      total_available: 100,
      description: 'Shared room with two queen beds for 2 guests. Comfortable and affordable option for friends or roommates attending together.',
      publishedAt: new Date().toISOString(),
    },
    {
      type: 'shared-4',
      price: 15000,
      total_available: 30,
      description: 'Spacious suite for 4 guests with two queen beds and a sleeper sofa. The most economical option with plenty of space for fellowship.',
      publishedAt: new Date().toISOString(),
    },
  ],
  merchItems: [
    { name: 'Conference T-Shirt', slug: 'conference-tshirt', description: 'Premium black cotton unisex t-shirt with gold crown emblem. Sizes S-3XL.', price: 2500, merch_status: 'open' },
    { name: 'Royalhouse Hoodie', slug: 'royalhouse-hoodie', description: 'Deep purple heavyweight hoodie with embroidered gold crown logo. Sizes S-3XL.', price: 5500, merch_status: 'open' },
    { name: 'RCI Crown Cap', slug: 'rci-crown-cap', description: 'Structured baseball cap with embroidered RCI crown logo. One size fits most.', price: 2000, merch_status: 'open' },
    { name: 'Royal Tote Bag', slug: 'royal-tote-bag', description: 'Heavy-duty canvas tote with RCI branding. Perfect for conference materials.', price: 1500, merch_status: 'open' },
    { name: 'Royalhouse Ceramic Mug', slug: 'royalhouse-ceramic-mug', description: '11oz ceramic mug with gold crown design. Microwave and dishwasher safe.', price: 1500, merch_status: 'open' },
    { name: 'RCI Travel Tumbler', slug: 'rci-travel-tumbler', description: 'Stainless steel 20oz insulated tumbler with RCI logo. Keeps drinks hot or cold.', price: 2500, merch_status: 'open' },
    { name: 'Kingdom Notes Journal', slug: 'kingdom-notes-journal', description: 'Hardcover journal with gold foil RCI logo. 200 lined pages for notes and prayers.', price: 2000, merch_status: 'open' },
    { name: 'Royal Wristband', slug: 'royal-wristband', description: 'Silicone wristband with "Royal Ladies...Arise and Shine!" inscription.', price: 500, merch_status: 'open' },
    { name: 'Recover All - Book', slug: 'recover-all-book', description: 'Inspirational book by Apostle General Sam Korankye Ankrah. Signed copies available.', price: 2000, merch_status: 'open' },
    { name: 'Conference Lanyard', slug: 'conference-lanyard', description: 'Official conference lanyard with detachable badge holder. Purple with gold logo.', price: 800, merch_status: 'open' },
    { name: 'RCI Crown Pin', slug: 'rci-crown-pin', description: 'Gold enamel lapel pin with RCI crown design. Collectible conference keepsake.', price: 1000, merch_status: 'open' },
    { name: 'Conference Sermon USB', slug: 'conference-sermon-usb', description: 'USB drive pre-loaded with all conference messages and worship sessions.', price: 1500, merch_status: 'closed' },
  ],
  pickupLocations: [
    { name: 'Hotel Main Lobby', address: 'Washington Dulles Airport Marriott, 45020 Aviation Dr, Dulles, VA 20166' },
    { name: 'Kingdom Center (NY)', address: 'Royalhouse Kingdom Center, Bronx, NY' },
    { name: 'Covenant Center (NJ)', address: 'Royalhouse Covenant Center, Newark, NJ' },
    { name: 'Miracle Life Center (ATL)', address: 'Royalhouse Miracle Life Center, Atlanta, GA' },
    { name: 'Bread of Life Center (NC)', address: 'Royalhouse Bread of Life Center, Charlotte, NC' },
    { name: 'Breakthrough Center (VA)', address: 'Royalhouse Breakthrough Center, Richmond, VA' },
    { name: 'Latter Rain Center (NY)', address: 'Royalhouse Latter Rain Center, Brooklyn, NY' },
    { name: 'Mt. Zion Center (MA)', address: 'Royalhouse Mt. Zion Center, Boston, MA' },
    { name: 'Grace2Grace Center (MD)', address: 'Royalhouse Grace2Grace Center, Baltimore, MD' },
    { name: 'Philadelphia Mission (PA)', address: 'Royalhouse Philadelphia Mission, Philadelphia, PA' },
    { name: 'DC Mission', address: 'Royalhouse DC Mission, Washington, DC' },
    { name: 'Delaware Fellowship', address: 'Royalhouse Delaware Fellowship, Wilmington, DE' },
    { name: 'Victory Center (CT)', address: 'Royalhouse Victory Center, Hartford, CT' },
    { name: 'Buffalo Fellowship (NY)', address: 'Royalhouse Buffalo Fellowship, Buffalo, NY' },
    { name: 'Norfolk Mission (VA)', address: 'Royalhouse Norfolk Mission, Norfolk, VA' },
    { name: 'Houston Mission (TX)', address: 'Royalhouse Houston Mission, Houston, TX' },
    { name: 'Washington Fellowship (WA)', address: 'Royalhouse Washington Fellowship, Seattle, WA' },
  ],
};

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const em = strapi.db;

  const existingConfs = await em.query('api::conference.conference').count();
  if (existingConfs > 0) {
    strapi.log.info('Seed: data already exists, skipping.');
    return;
  }

  strapi.log.info('Seed: inserting conferences...');
  const createdConfs: { id: number }[] = [];
  for (const conf of seedData.conferences) {
    const created = await em.query('api::conference.conference').create({ data: conf });
    createdConfs.push(created as { id: number });
  }
  const confId = createdConfs[0].id;

  strapi.log.info('Seed: inserting room types...');
  for (const rt of seedData.roomTypes) {
    await em.query('api::room-type.room-type').create({
      data: { ...rt, conferences: [confId], publishedAt: new Date().toISOString() },
    });
  }

  strapi.log.info('Seed: inserting merch items...');
  for (const mi of seedData.merchItems) {
    await em.query('api::merch-item.merch-item').create({
      data: { ...mi, conferences: [confId], publishedAt: new Date().toISOString() },
    });
  }

  strapi.log.info('Seed: inserting pickup locations...');
  for (const pl of seedData.pickupLocations) {
    await em.query('api::pickup-location.pickup-location').create({
      data: { ...pl, conferences: [confId], publishedAt: new Date().toISOString() },
    });
  }

  strapi.log.info('Seed: complete.');
};
