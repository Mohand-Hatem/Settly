/**
 * Seed Script: 10 KnowledgeArticles for RAG corpus
 * Governed by SEED_DATA.md §2, RAG.md §3, #99 (English only V1), #101 (Arabic fields empty).
 *
 * Idempotent: upserts by slug (deletes + recreates embeddings atomically per Decision #42).
 * Backs off on Gemini rate limits (60s).
 *
 * Usage: npm --prefix backend run seed:knowledge
 */

process.env.NODE_ENV = "development"; // enable real Gemini embeddings

import "dotenv/config";
import { knowledgeService } from "../src/modules/knowledge/service/index.js";
import { logger } from "../src/shared/logger/index.js";

interface ArticleSeed {
  slug: string;
  titleEn: string;
  bodyEn: string;
  category: "GUIDE" | "FAQ" | "LEGAL" | "MARKET";
  areaSlug?: string; // resolved to areaId below
}

const ARTICLES: ArticleSeed[] = [
  // ============================================================
  // 1. New Cairo Area Guide
  // ============================================================
  {
    slug: "new-cairo-area-guide",
    titleEn: "New Cairo Area Guide",
    category: "GUIDE",
    bodyEn: `New Cairo is one of Egypt's fastest-growing residential destinations, located east of Cairo's historic city center. Developed predominantly since the early 2000s, it now houses a broad mix of resale apartments, villas, and compound communities.

## Overview
New Cairo encompasses several key districts including the Fifth Settlement (Al-Tassae), the Third Settlement, and the coveted Katameya Heights area. The district is known for its wide tree-lined roads, planned infrastructure, and proximity to major universities and international schools.

## Transportation
The district is served by the Ring Road and Cairo-Suez Road, providing direct access to central Cairo in 25–40 minutes depending on traffic. The new monorail line connects New Cairo to Adly Mansour interchange station. Private car ownership remains the dominant mode of transport, though ride-hailing services (Uber, Careem) are readily available.

## Schools and Education
New Cairo hosts a dense cluster of international schools, including Cairo American College, Modern English School (MES), and several British and French-curriculum schools. The American University in Cairo (AUC) main campus is located within New Cairo, making the area popular among faculty and international staff.

## Healthcare
Major hospitals in New Cairo include Dar Al Fouad, As-Salam International Hospital, and several polyclinics operated by premium healthcare groups. Most compound communities have on-site or nearby medical facilities.

## Shopping and Leisure
Point 90 Mall, Cairo Festival City, and Mivida Town Centre are the district's main retail anchors. Restaurants, coffee shops, and recreational facilities have proliferated across the Fifth Settlement, particularly along Teseen Street (the 90th Street corridor), which serves as the social and commercial spine of New Cairo.

## Property Market
Typical apartment sizes range from 120 sqm studios-and-one-bedroom units to 300+ sqm penthouses in luxury compounds. Resale prices generally range from EGP 18,000–45,000 per sqm depending on compound prestige, view, and floor. Villas in gated communities such as Katameya Heights command significant premiums. The area is primarily a sale market; rental activity exists but is more limited than in central Cairo.

## Buyer Considerations
Due diligence on compound developer reputation is important — some older projects have stalled service fees or shared facilities in poor condition. Always verify the property's resale title deed (sahl el-tasreeh) and confirm that the seller has completed all installment payments to the developer.`,
  },

  // ============================================================
  // 2. Sheikh Zayed Area Guide
  // ============================================================
  {
    slug: "sheikh-zayed-area-guide",
    titleEn: "Sheikh Zayed Area Guide",
    category: "GUIDE",
    bodyEn: `Sheikh Zayed City is a planned urban community located in Giza Governorate, on the western outskirts of Cairo. It was developed in the 1990s and early 2000s as a satellite city to relieve pressure on Cairo's congested urban core.

## Overview
The city is organized around numbered districts (hayy), with the Beverly Hills compound and Dreamland Golf Course community among the most recognized landmarks. The area has matured significantly, with a well-established retail and services sector.

## Transportation
Sheikh Zayed is accessible via the Cairo–Alexandria Desert Road and the 26th of July Corridor. Travel to Cairo's downtown can range from 30–60 minutes depending on the route and time of day. The Western Cairo Monorail line is expected to improve connectivity significantly upon completion.

## Schools and Education
Several prominent schools operate in Sheikh Zayed including El Alsson British and American International School, GEMS International School, and a number of Egyptian private and language schools. The area's international school density makes it popular with families with school-age children.

## Healthcare
Dar Al Fouad Hospital has a major facility in Sheikh Zayed. Other hospitals and specialist clinics serve the city's growing population.

## Shopping and Leisure
Arkan Mall and Genena Mall serve as the primary retail destinations. The Dreamland Golf Course offers a leisure anchor for villa communities. The 26th of July Corridor hosts a vibrant strip of restaurants, cafes, and entertainment venues.

## Property Market
Sheikh Zayed offers a mix of villas, townhouses, twin houses, and apartments. Prices per sqm for apartments typically range from EGP 15,000–30,000, while villa land-plus-construction values vary widely by compound and finish level. The Beverly Hills compound commands consistent premiums for its security and amenity level.

## Buyer Considerations
Older buildings in the numbered districts (hayy) may require additional maintenance assessment. Confirm utilities connections and service fee obligations before purchase. For villa transactions, verify the allocation letter, building permit (rokhsa) and title deed chain carefully.`,
  },

  // ============================================================
  // 3. Maadi Area Guide
  // ============================================================
  {
    slug: "maadi-area-guide",
    titleEn: "Maadi Area Guide",
    category: "GUIDE",
    bodyEn: `Maadi is one of Cairo's most established and sought-after residential districts, located south of downtown Cairo along the east bank of the Nile. Developed during the British colonial era, the area retains wide, tree-lined streets, low-rise garden villas, and a distinctive green character uncommon in Egypt's urban fabric.

## Overview
Maadi is divided into several sub-districts including Old Maadi (the leafy core with detached villas), Sarayat (known for its greenery and expat community), Degla (a more modern, apartment-dense area), and New Maadi (commercial and mixed-use). The area hosts a significant expatriate population owing to its international schools and proximity to embassies.

## Transportation
The Cairo Metro Line 1 serves Maadi directly, with stops at Maadi, Hadayek El Maadi, and Sakanat El Maadi — giving residents one of the fastest connections to central Cairo (20–30 minutes to Tahrir Square). Road access via the Corniche and Ring Road is also good.

## Schools and Education
Maadi is home to the Cairo American College (a K-12 American-curriculum school), Maadi British International School, and Schutz American School. Several Egyptian language schools also operate in the area.

## Healthcare
Al-Salam International Hospital and several specialist clinics are located within or immediately adjacent to Maadi. The district's established infrastructure means healthcare access is among the best in Cairo.

## Shopping and Leisure
Maadi's Road 9 is a popular dining and café strip. City Stars and Mall of Arabia are the closest large malls, though Maadi itself has a walkable retail corridor on Road 231. The Maadi Yacht Club and Maadi Sports Club provide leisure facilities for residents.

## Property Market
Property types span detached garden villas (particularly in Old Maadi and Sarayat), apartments, and newer high-rise buildings in Degla and New Maadi. Villas in Old Maadi and Sarayat are among the most sought-after in Cairo and command premium prices due to their scarcity. Apartment resale prices range from EGP 20,000–50,000 per sqm in Sarayat and Degla, with villas priced well above that on a per-sqm basis.

## Buyer Considerations
Villa transactions in Old Maadi involve complex title histories due to the age of some properties — thorough legal due diligence on the deed chain is essential. Rental markets in Maadi are active, driven by expatriate demand, though the focus on Settly is resale.`,
  },

  // ============================================================
  // 4. North Coast Area Guide
  // ============================================================
  {
    slug: "north-coast-area-guide",
    titleEn: "North Coast (Sahel) Area Guide",
    category: "GUIDE",
    bodyEn: `Egypt's North Coast — locally known as Sahel — stretches approximately 500 km along the Mediterranean Sea from Alexandria westward toward Marsa Matrouh. The coastal corridor between Alex and Ras El Hekma has become Egypt's most active second-home and holiday property market.

## Overview
The coast is organized into residential "kilometer" zones roughly measured from Alexandria. Major residential destinations include Hacienda Bay (km 99), Marassi (km 94), Seashell, Fouka Bay, La Vista, and dozens of other gated compounds. Each summer, millions of Egyptians and Gulf visitors descend on the coast; outside the June–September season the area is largely quiet.

## Seasonal Nature
The North Coast is overwhelmingly a seasonal market. Properties are used primarily in summer and lie vacant for much of the year. This affects maintenance, service-fee recovery, and resale liquidity. Buyers should factor in the costs of property management during the off-season.

## Transportation
The Alexandria–Matrouh Coastal Road (the Desert Road) connects the coast to Cairo in 2.5–3 hours by car. No direct train service reaches most compound zones. The new North Coast Road (currently under construction/expansion) will eventually reduce travel times and open additional development land.

## Amenities within Compounds
High-end compounds offer private beaches, pools, sports facilities, restaurants, and in some cases medical clinics. Amenity quality varies significantly — Marassi and Hacienda Bay are considered benchmark for facilities.

## Property Types
Chalets (apartments in beach compounds), twin houses, townhouses, and standalone villas are the main property categories. Sizes typically start at 60–80 sqm for a studio chalet and reach 400+ sqm for large beachfront villas.

## Property Market
North Coast prices have risen sharply since 2021. Chalet prices in established compounds range from EGP 1.5M–8M+ depending on location, size, view (sea vs. garden), and compound tier. Price volatility is higher than in Cairo's permanent residential markets due to the investment/speculation component.

## Buyer Considerations
Verify the compound developer's track record — several smaller projects have experienced significant delays. Confirm service fee levels (annual) before purchasing, as these vary enormously and directly impact running costs. For sea-view units, confirm the exact floor and view angle — marketing materials are frequently optimistic.`,
  },

  // ============================================================
  // 5. 6th of October City Area Guide
  // ============================================================
  {
    slug: "6th-of-october-area-guide",
    titleEn: "6th of October City Area Guide",
    category: "GUIDE",
    bodyEn: `6th of October City is one of Egypt's largest planned satellite cities, located in Giza Governorate approximately 30 km southwest of Cairo's historic center. Built from the 1970s onward, the city has evolved into a self-contained urban area with significant industrial, commercial, and residential zones.

## Overview
The city is divided into numbered districts, with wealthier residential compounds concentrated in the newer western and northern extensions. Golf compounds such as Wadi El Nile and Zayed City (which straddles the boundary with Sheikh Zayed) are among the most established residential addresses.

## Transportation
The city is served by the Cairo–Alexandria Desert Road and the 26th of July Corridor. The new Greater Cairo metro extensions and the Western Cairo Monorail are expected to improve connectivity once fully operational. Current travel times to central Cairo vary from 40–70 minutes by car.

## Schools and Education
Several language schools and universities operate in 6th of October, including 6th of October University and branches of other private universities. The school density is lower than in New Cairo or Sheikh Zayed.

## Industrial and Employment Base
The city hosts a significant industrial zone that provides local employment, distinguishing it from primarily dormitory satellite cities.

## Property Market
6th of October offers some of the most affordable large-unit resale apartments in Greater Cairo, making it popular with middle-income buyers. Apartment resale prices typically range from EGP 8,000–18,000 per sqm in established districts, rising in newer compound developments.

## Buyer Considerations
Infrastructure and service quality vary significantly between districts. Older areas may have maintenance challenges. The city's mixed industrial-residential character is a consideration for lifestyle buyers.`,
  },

  // ============================================================
  // 6. Buying Property in Egypt – FAQ
  // ============================================================
  {
    slug: "buying-property-egypt-faq",
    titleEn: "Buying Property in Egypt — Frequently Asked Questions",
    category: "FAQ",
    bodyEn: `## Can foreigners buy property in Egypt?
Yes. Foreign nationals may purchase property in Egypt subject to certain restrictions. Non-Egyptians may own up to two residential units in Egypt totaling no more than 4,000 sqm in total land area. Special zones (such as Sinai) have additional restrictions. It is advisable to consult a licensed Egyptian real estate attorney before proceeding.

## What documents do I need to buy a property in Egypt?
For Egyptian buyers: National ID (Bateqa Wataneyya), proof of address, and the signed purchase contract (aqd bay). For foreign buyers: valid passport and residence permit or entry visa. The seller must provide the original title deed (sahl el-tasreeh or senet el-melkeyya) and a copy of the building permit (rokhsa el-bena) where applicable.

## What taxes and fees apply to a property purchase?
The primary costs include: real estate registration fees (approximately 3% of declared value, though this can vary), notary fees, lawyer fees (1–2%), and any outstanding mortgage balance or developer installments owed by the seller. Always obtain a disclosure of all outstanding financial obligations before signing.

## How does property registration work in Egypt?
Property registration (tasjeeel) is handled by the Real Estate Publicity Department (Shart El-Aqari). Registration formally records ownership in the government registry. Without registration, the buyer holds contractual rights but not a registered title deed. Many resale transactions in Egypt involve "contract of sale" rather than a freshly registered deed — understand the chain of title carefully.

## What is the role of a real estate agent in Egypt?
Licensed agents facilitate property discovery, viewings, and price negotiation. Agency commission is typically 2.5% of the sale price, split between buyer and seller agents or paid by one party depending on the agreement. Agents must be verified by a licensed brokerage.

## How long does a typical resale transaction take?
A straightforward resale transaction (title-deed available, no mortgage) typically takes 4–8 weeks from offer acceptance to signing a final sale agreement. Registration at the Shart El-Aqari can add additional time. Transactions involving developer-held units with existing installment plans take longer.

## What is a reservation deposit?
On Settly, once a buyer's offer is accepted, the buyer pays a reservation deposit of 5% of the agreed price (capped at EGP 50,000) to formally reserve the property during the completion process. This deposit is held securely and applied to the purchase price at completion. If the transaction falls through through no fault of the buyer, the deposit is refunded per the platform's refund policy.`,
  },

  // ============================================================
  // 7. How Offers Work on Settly
  // ============================================================
  {
    slug: "how-offers-work-faq",
    titleEn: "How Offers Work on Settly",
    category: "FAQ",
    bodyEn: `## What is an offer on Settly?
An offer is a formal price proposal made by a buyer to a listing's agent. Submitting an offer on Settly starts a structured negotiation process with a clear audit trail for both parties.

## Who can make an offer?
Any registered buyer with a verified email address can make an offer on a resale property listed as For Sale. You cannot make an offer on your own listing if you are also an agent.

## How does the offer negotiation work?
Once you submit an offer, the agent can: accept it, reject it, or counter with a different amount or conditions. You can then accept the counter, reject it, or counter again. This back-and-forth continues until either party accepts or the offer expires (72 hours after an acceptance without deposit payment).

## What happens when an offer is accepted?
Once the agent accepts your offer, you have 72 hours to pay the reservation deposit (5% of the agreed price, capped at EGP 50,000). Paying the deposit moves the property to Reserved status, locking out other offers.

## Can I withdraw my offer?
Yes. You can withdraw your offer at any point before it is accepted without penalty. Once an offer is accepted, withdrawing will forfeit the reservation deposit if it has already been paid.

## What if another offer is accepted before mine?
If another buyer's offer is accepted and they pay the deposit first, your offer is automatically marked as Superseded and the property becomes Reserved. You will be notified.

## Can there be multiple active offers at once?
Yes — the agent can receive multiple offers simultaneously and choose which to engage with. However, only one offer can be accepted at a time, and once a deposit is paid, all competing offers are superseded.

## What happens after the deposit is paid?
After the deposit, the buyer and agent work toward formal sale completion. Both must confirm completion on Settly within 30 days. Confirmation by both parties marks the offer as Completed and the property as Sold.`,
  },

  // ============================================================
  // 8. Reservation Deposit FAQ
  // ============================================================
  {
    slug: "reservation-deposit-faq",
    titleEn: "Reservation Deposit — What You Need to Know",
    category: "FAQ",
    bodyEn: `## What is the reservation deposit?
The reservation deposit is a 5% payment of the agreed sale price (capped at EGP 50,000) paid by the buyer to formally reserve a resale property on Settly. It is collected via Paymob's secure payment gateway.

## Why is there a deposit cap of EGP 50,000?
The 5% rule applies standard Egyptian real estate practice, and the EGP 50,000 cap protects buyers on high-value transactions from disproportionately large upfront commitments at the reservation stage.

## Is the deposit refundable?
The deposit is fully refundable if:
- The sale does not complete due to circumstances outside the buyer's control (e.g., the agent or seller withdraws).
- An admin reviews the situation and confirms a legitimate reason for the deal not completing.

The deposit may be forfeited if the buyer withdraws after the deposit is paid without a valid reason recognized by Settly's refund policy.

## How is the deposit payment processed?
Settly uses Paymob's hosted checkout. After your offer is accepted, you will be redirected to Paymob's secure payment page to complete the deposit payment via credit/debit card.

## When is the deposit returned?
Refunds are initiated within 3–5 business days of a confirmed refund decision. The actual credit to your account depends on your card issuer but typically takes 5–10 additional business days.

## Does the deposit count toward the purchase price?
Yes. The reservation deposit is credited toward the final agreed purchase price at the time of sale completion.

## What if the 72-hour payment window expires?
If you do not pay the deposit within 72 hours of an accepted offer, the offer expires. The property is relisted and other buyers can make offers. You can make a new offer, subject to the agent's willingness to re-engage.`,
  },

  // ============================================================
  // 9. Egypt Real Estate Law Summary
  // ============================================================
  {
    slug: "egypt-real-estate-law-summary",
    titleEn: "Egypt Real Estate Law — Key Points for Buyers and Agents",
    category: "LEGAL",
    bodyEn: `This summary covers key legal provisions relevant to residential real estate transactions in Egypt. It is provided for general informational purposes only and does not constitute legal advice. Always consult a licensed Egyptian attorney for specific transactions.

## Title and Ownership
Egyptian law recognizes several forms of property ownership: full freehold title (melkeyya), long-term usufruct (haqq el-entefa'), and contractual buyer rights (aqd bay ghayr mosal) where registration is incomplete. The strongest form of ownership for a buyer is a registered title deed at the Real Estate Publicity Department (Shart El-Aqari).

## Real Estate Registration Law (Law No. 83 of 2016 and earlier laws)
Egypt's real estate registration framework requires that ownership transfers be recorded with the Shart El-Aqari to be effective against third parties. Unregistered contracts are valid between parties but do not bind third parties including subsequent buyers and creditors. Buyers should strongly prefer acquiring properties with a clear registered title deed or following a clear registration path.

## Real Estate Broker Regulation
Real estate brokers in Egypt are required to operate under a licensed brokerage entity. The General Authority for Investment and Free Zones (GAFI) and relevant governorate authorities govern broker licensing. Buyers should verify that their agent operates within a licensed brokerage.

## Consumer Protection in Real Estate (Law No. 181 of 2018)
Egypt's Consumer Protection Law applies to certain real estate developer-to-buyer transactions. Key provisions include mandatory disclosure of property specifications and rights of recourse for defective or misrepresented properties.

## Foreign Ownership Rules
Non-Egyptians may own up to two residential units in Egypt, not exceeding 4,000 sqm total land area, subject to approval and certain zone restrictions (Sinai Peninsula has additional limitations). Foreign owners must convert purchase funds through an Egyptian bank (documented forex transfer).

## Capital Gains and Transfer Taxes
Real estate transactions in Egypt may be subject to capital gains tax on sellers' profits and real estate transaction taxes. Rates and exemptions change periodically — always verify current rates with a tax advisor before completing a transaction.

## Dispute Resolution
Real estate disputes in Egypt are typically resolved through civil courts. Some developer contracts include arbitration clauses. Ensure that any purchase contract specifies the governing law and dispute resolution mechanism clearly.`,
  },

  // ============================================================
  // 10. Egypt Property Market Overview
  // ============================================================
  {
    slug: "egypt-market-overview-2024",
    titleEn: "Egypt Property Market Overview — Key Trends",
    category: "MARKET",
    bodyEn: `## Market Context
Egypt's residential property market has experienced significant price growth over the past several years, driven primarily by currency devaluation cycles (the Egyptian pound lost substantial value against the US dollar in 2022 and 2023), sustained population growth, and limited supply of quality housing stock in established areas.

## Price Dynamics
Property prices in Egypt are quoted in Egyptian pounds (EGP). Real (inflation-adjusted) price growth has been more modest than nominal growth due to high inflation. In USD terms, Cairo property prices are generally considered affordable by regional MENA standards. Many investors view real estate as a primary inflation hedge, contributing to demand even during economic stress periods.

## Key Demand Drivers
- Young, urbanizing population with growing household formation
- Significant Egyptian diaspora investment (primarily Gulf-based Egyptians buying in Cairo)
- Tourism-adjacent demand on the North Coast and Red Sea
- Government mega-project development (New Administrative Capital, New Alamein) generating secondary market momentum

## Supply Dynamics
The market is characterized by significant developer-led new supply (off-plan), which competes with the resale market that Settly serves. Major developers (Emaar Misr, Talaat Moustafa Group, Palm Hills, Ora Developers) have large ongoing pipelines. Resale supply is constrained by owner reluctance to sell in periods of currency uncertainty.

## Investment Considerations
Buyers entering the Egyptian market should consider: currency risk (for foreign buyers or buyers with foreign-currency income), liquidity risk (Egyptian property is not a liquid asset), developer risk (for off-plan purchases), and registration cost implications for total transaction cost.

## Regional Highlights
- **New Cairo**: Strong demand, high supply pipeline, premiums for established compounds
- **Sheikh Zayed / 6th October**: Broader income range, value options, growing infrastructure
- **Maadi**: Stable, premium, limited supply of premium villas, expatriate demand
- **North Coast**: Seasonal, high volatility, significant developer concentration risk in some zones

## Market Outlook
Market performance depends heavily on macroeconomic stability, foreign currency availability, and government housing policy. The Egyptian government has expressed strong support for the real estate sector through infrastructure investment and special economic zones. Interest rate conditions affect affordability for leveraged buyers, though the majority of Egyptian residential transactions are cash (unleveraged).`,
  },
];

// ============================================================
// Seed runner
// ============================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("================================================================");
  console.log("Settly — Knowledge Corpus Seed (RAG.md §3, SEED_DATA.md §2)");
  console.log("================================================================\n");
  console.log(`Seeding ${ARTICLES.length} KnowledgeArticles (English only, V1 per #99/#101)\n`);

  let seeded = 0;
  let skipped = 0;

  for (const article of ARTICLES) {
    console.log(`[${seeded + skipped + 1}/${ARTICLES.length}] Ingesting: "${article.titleEn}" (${article.category})`);

    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries <= MAX_RETRIES) {
      try {
        await knowledgeService.ingestArticle({
          slug: article.slug,
          titleEn: article.titleEn,
          bodyEn: article.bodyEn,
          category: article.category,
          areaId: null, // Area resolution would need a lookup — simplified for seed
          isPublished: true,
        });

        console.log(`  ✔ Ingested: ${article.slug}`);
        seeded++;
        break;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const isRateLimit =
          message.includes("429") ||
          message.includes("rate") ||
          message.includes("quota");

        if (isRateLimit && retries < MAX_RETRIES) {
          console.log(`  ⚠ Rate limit hit — backing off 60s (attempt ${retries + 1}/${MAX_RETRIES})`);
          await sleep(60_000);
          retries++;
        } else {
          console.error(`  ✗ Failed to ingest "${article.slug}":`, message);
          skipped++;
          break;
        }
      }
    }

    // Brief pause between articles to avoid rate-limit bursts
    if (seeded + skipped < ARTICLES.length) {
      await sleep(500);
    }
  }

  console.log(`\n================================================================`);
  console.log(`Seed complete: ${seeded} ingested, ${skipped} failed`);
  console.log(`================================================================`);

  if (skipped > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error({ err }, "seed:knowledge failed");
  process.exit(1);
});
