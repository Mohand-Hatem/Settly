"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Star,
  Check,
  MessageSquare,
  Lock,
  X,
} from "lucide-react";
import "@/styles/settly/agent-profile.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PortfolioItem {
  id: string;
  title: string;
  corridor: string;
  priceEgp: string;
  specs: string;
  image: string;
  href: string;
}

interface TransactionRecord {
  assetClass: string;
  compound: string;
  settlementEgp: string;
  period: string;
}

interface TestimonialRecord {
  quote: string;
  client: string;
  title: string;
}

interface AdvisorDossier {
  id: string;
  name: string;
  role: string;
  desk: string;
  license: string;
  image: string;
  rating: number;
  reviews: number;
  vol: string;
  deals: number;
  activeCount: number;
  response: string;
  pills: string[];
  bio: string;
  territoryPillar: string;
  allocationsPillar: string;
  whatsapp?: string;
  portfolio: PortfolioItem[];
  settlements: TransactionRecord[];
  testimonials: TestimonialRecord[];
}

const ADVISORS_DATA: Record<string, AdvisorDossier> = {
  "karim-el-sayed": {
    id: "karim-el-sayed",
    name: "Karim El-Sayed",
    role: "Senior Private Client Partner",
    desk: "Sovereign Advisory Desk · Golden Square & New Cairo",
    license: "License #EG-8841-B",
    image: "/images/1.jpg",
    rating: 4.98,
    reviews: 62,
    vol: "EGP 2.45B",
    deals: 48,
    activeCount: 14,
    response: "11 Mins",
    pills: [
      "Palm Hills Certified Partner",
      "Emaar Platinum Desk",
      "Golden Square Specialist",
      "100% Freehold Escrow",
    ],
    bio: "With over 12 years of specialized luxury brokerage leadership across New Cairo and Golden Square, Karim represents institutional family offices, private equity executives, and international diaspora buyers. Operating with full transparency, every transaction is backed by verified property deeds and Settly's secure deposit protection.",
    territoryPillar: "Golden Square, New Cairo & Katameya Heights prime residential belts.",
    allocationsPillar: "Official developer API tie-in for Palm Hills, Emaar Misr, and SODIC releases.",
    whatsapp: "201000000000",
    portfolio: [
      {
        id: "p1",
        title: "Lake View Signature Standalone Villa",
        corridor: "Golden Square · Lake View",
        priceEgp: "EGP 34,500,000",
        specs: "540 m² · 5 Beds · 6 Baths",
        image: "/images/hero.jpg",
        href: "/search?corridor=new-cairo",
      },
      {
        id: "p2",
        title: "Mivida Crescent Prime Garden Estate",
        corridor: "Golden Square · Mivida",
        priceEgp: "EGP 42,000,000",
        specs: "620 m² · 6 Beds · 7 Baths",
        image: "/images/8.jpg",
        href: "/search?corridor=new-cairo",
      },
      {
        id: "p3",
        title: "Katameya Dunes Horizon Fairway Villa",
        corridor: "New Cairo · Katameya Dunes",
        priceEgp: "EGP 29,800,000",
        specs: "480 m² · 4 Beds · 5 Baths",
        image: "/images/9.jpg",
        href: "/search?corridor=new-cairo",
      },
      {
        id: "p4",
        title: "Palm Hills Bamboo Botanical Twin Villa",
        corridor: "New Cairo · Palm Hills",
        priceEgp: "EGP 22,400,000",
        specs: "385 m² · 4 Beds · 4 Baths",
        image: "/images/10.jpg",
        href: "/search?corridor=new-cairo",
      },
    ],
    settlements: [
      {
        assetClass: "Lake View Standalone Villa",
        compound: "Golden Square, New Cairo",
        settlementEgp: "EGP 32,500,000",
        period: "Q4 2025",
      },
      {
        assetClass: "Katameya Dunes Fairway Villa",
        compound: "Fifth Settlement, New Cairo",
        settlementEgp: "EGP 28,200,000",
        period: "Q3 2025",
      },
      {
        assetClass: "Mivida Park Residence",
        compound: "Golden Square, New Cairo",
        settlementEgp: "EGP 41,000,000",
        period: "Q2 2025",
      },
      {
        assetClass: "Villette Sky Villa Duplex",
        compound: "South 90th, New Cairo",
        settlementEgp: "EGP 24,900,000",
        period: "Q1 2025",
      },
    ],
    testimonials: [
      {
        quote: "Karim secured our off-market acquisition in Lake View with total discretion. His direct access to Palm Hills title deeds and escrow legal team eliminated every friction point.",
        client: "Hisham El-Gammal",
        title: "Managing Partner, Delta Capital Private Office",
      },
      {
        quote: "As an overseas investor in London, Settly's verified data and Karim's 10-minute response SLA made the AED-to-EGP repatriation and handover completely transparent.",
        client: "Dr. Sherif Allam",
        title: "Private Diaspora Investor · London / Cairo",
      },
    ],
  },
  "nourhan-mansour": {
    id: "nourhan-mansour",
    name: "Nourhan Mansour",
    role: "West Cairo Luxury Director",
    desk: "Prime West Advisory Desk · Sheikh Zayed & New Zayed",
    license: "License #EG-9204-A",
    image: "/images/2.jpg",
    rating: 4.95,
    reviews: 58,
    vol: "EGP 2.90B",
    deals: 52,
    activeCount: 16,
    response: "9 Mins",
    pills: [
      "SODIC Signature Partner",
      "Ora Elite Desk",
      "New Zayed Master Specialist",
      "Ultra HNW Desk",
    ],
    bio: "Directing West Cairo's premier private brokerage desk, Nourhan curates signature standalones and branded penthouses in New Zayed, Karmell, and Rivers. Renowned for institutional financial structuring and confidentiality agreements, she manages portfolio mandates for top Egyptian and GCC industrial families.",
    territoryPillar: "Sheikh Zayed, New Zayed (Karmell & Rivers) & Beverly Hills corridors.",
    allocationsPillar: "Priority allocation rights with SODIC, Ora Developers, and Dorra Group.",
    whatsapp: "201000000000",
    portfolio: [
      {
        id: "p1",
        title: "Allegria Signature Fairway Villa",
        corridor: "Sheikh Zayed · Allegria",
        priceEgp: "EGP 38,000,000",
        specs: "560 m² · 5 Beds · 6 Baths",
        image: "/images/3.jpg",
        href: "/search?corridor=west-cairo",
      },
      {
        id: "p2",
        title: "Karmell West Botanical Villa",
        corridor: "New Zayed · Karmell",
        priceEgp: "EGP 26,500,000",
        specs: "410 m² · 4 Beds · 5 Baths",
        image: "/images/4.jpg",
        href: "/search?corridor=west-cairo",
      },
    ],
    settlements: [
      {
        assetClass: "Allegria Signature Villa",
        compound: "Sheikh Zayed, West Cairo",
        settlementEgp: "EGP 36,000,000",
        period: "Q4 2025",
      },
      {
        assetClass: "Cairo Gate Skyline Penthouse",
        compound: "Sheikh Zayed, West Cairo",
        settlementEgp: "EGP 21,500,000",
        period: "Q3 2025",
      },
    ],
    testimonials: [
      {
        quote: "Nourhan's deep network in Sheikh Zayed allowed us to close an off-plan penthouse in record time with verified title security.",
        client: "Yasser Al-Mansour",
        title: "Family Office Principal · Riyadh",
      },
    ],
  },
  "laila-mansour": {
    id: "laila-mansour",
    name: "Laila Mansour",
    role: "Managing Director",
    desk: "Mansour Private Office · Sheikh Zayed & West Cairo",
    license: "License #EG-9204-A",
    image: "/images/2.jpg",
    rating: 5.0,
    reviews: 84,
    vol: "EGP 3.10B",
    deals: 61,
    activeCount: 19,
    response: "9 Mins",
    pills: [
      "SODIC Signature Partner",
      "Ora Elite Desk",
      "New Zayed Master Specialist",
      "Ultra HNW Desk",
    ],
    bio: "Directing West Cairo's premier private brokerage desk, Laila curates signature standalones and branded penthouses in New Zayed, Karmell, and Rivers. Renowned for institutional financial structuring and confidentiality agreements, she manages portfolio mandates for top Egyptian and GCC industrial families.",
    territoryPillar: "Sheikh Zayed, New Zayed (Karmell & Rivers) & Beverly Hills corridors.",
    allocationsPillar: "Priority allocation rights with SODIC, Ora Developers, and Dorra Group.",
    whatsapp: "201000000000",
    portfolio: [
      {
        id: "p1",
        title: "Allegria Signature Fairway Villa",
        corridor: "Sheikh Zayed · Allegria",
        priceEgp: "EGP 38,000,000",
        specs: "560 m² · 5 Beds · 6 Baths",
        image: "/images/3.jpg",
        href: "/search?corridor=west-cairo",
      },
      {
        id: "p2",
        title: "Karmell West Botanical Villa",
        corridor: "New Zayed · Karmell",
        priceEgp: "EGP 26,500,000",
        specs: "410 m² · 4 Beds · 5 Baths",
        image: "/images/4.jpg",
        href: "/search?corridor=west-cairo",
      },
    ],
    settlements: [
      {
        assetClass: "Allegria Signature Villa",
        compound: "Sheikh Zayed, West Cairo",
        settlementEgp: "EGP 36,000,000",
        period: "Q4 2025",
      },
      {
        assetClass: "Cairo Gate Skyline Penthouse",
        compound: "Sheikh Zayed, West Cairo",
        settlementEgp: "EGP 21,500,000",
        period: "Q3 2025",
      },
    ],
    testimonials: [
      {
        quote: "Laila's private office orchestrated our family's estate acquisitions across New Zayed with absolute discretion and perfection.",
        client: "Eng. Amr Soliman",
        title: "Venture Principal · Cairo",
      },
    ],
  },
  "tarek-el-gazzar": {
    id: "tarek-el-gazzar",
    name: "Tarek El-Gazzar",
    role: "Coastal & Sovereign Asset Lead",
    desk: "Mediterranean Desk · Sahel & Ras El Hekma",
    license: "License #EG-7719-C",
    image: "/images/phone.jpg",
    rating: 4.98,
    reviews: 49,
    vol: "EGP 2.80B",
    deals: 42,
    activeCount: 11,
    response: "15 Mins",
    pills: [
      "Emaar Misr Prime",
      "TMG Coastal Desk",
      "Ras El Hekma Specialist",
      "Beachfront Estates",
    ],
    bio: "Tarek leads coastal strategic acquisitions with a specific focus on the multi-billion-dollar Ras El Hekma megaproject and Mediterranean shoreline estates. He advises multinational consortia and high-net-worth individuals on premier prime beach frontage and long-term land appreciation.",
    territoryPillar: "Ras El Hekma, Sidi Heneish, and Mediterranean coastal enclaves.",
    allocationsPillar: "Direct allocations with Emaar Misr (Marassi/Soul) and Talaat Moustafa Group.",
    whatsapp: "201000000000",
    portfolio: [
      {
        id: "p1",
        title: "Ras El Hekma Horizon Water Villa",
        corridor: "North Coast · Ras El Hekma",
        priceEgp: "EGP 48,000,000",
        specs: "510 m² · 5 Beds · 6 Baths",
        image: "/images/5.jpg",
        href: "/search?corridor=north-coast",
      },
      {
        id: "p2",
        title: "Silversands Azure Standalone",
        corridor: "North Coast · Silversands",
        priceEgp: "EGP 36,000,000",
        specs: "430 m² · 4 Beds · 5 Baths",
        image: "/images/6.jpg",
        href: "/search?corridor=north-coast",
      },
    ],
    settlements: [
      {
        assetClass: "Marassi Marina Waterfront Villa",
        compound: "Sidi Abdel Rahman, North Coast",
        settlementEgp: "EGP 44,000,000",
        period: "Q3 2025",
      },
    ],
    testimonials: [
      {
        quote: "Tarek navigated the offshore sovereign paperwork seamlessly. Our beachfront acquisition in Ras El Hekma was closed securely within 3 weeks.",
        client: "Bader Al-Sabah",
        title: "Private Investor · Kuwait",
      },
    ],
  },
  "laila-el-kady": {
    id: "laila-el-kady",
    name: "Laila El-Kady",
    role: "Red Sea Waterfront Advisor",
    desk: "Coastal Lagoons Desk · El Gouna",
    license: "License #EG-2024-0615",
    image: "/images/2.jpg",
    rating: 4.88,
    reviews: 24,
    vol: "EGP 950M",
    deals: 24,
    activeCount: 9,
    response: "14 Mins",
    pills: [
      "Orascom Development Partner",
      "Somabay Coastal",
      "El Gouna Marina",
      "Yachting Estates",
    ],
    bio: "Operating out of Abu Tig Marina in El Gouna, Laila is the designated advisor for luxury lagoon estates, golf villas, and private boat mooring residences along Egypt's Red Sea coast. She frequently facilitates foreign-denominated purchases and statutory tax certification.",
    territoryPillar: "El Gouna, Somabay & Sahl Hasheesh coastal strips.",
    allocationsPillar: "Direct accredited broker status with Orascom Development Egypt.",
    whatsapp: "201000000000",
    portfolio: [
      {
        id: "p1",
        title: "Fanadir Bay Waterfront Lagoon Villa",
        corridor: "El Gouna · Fanadir Bay",
        priceEgp: "EGP 39,500,000",
        specs: "470 m² · 5 Beds · 5 Baths",
        image: "/images/7.jpg",
        href: "/search?corridor=red-sea",
      },
    ],
    settlements: [
      {
        assetClass: "Ancient Sands Lagoon Residence",
        compound: "El Gouna, Red Sea",
        settlementEgp: "EGP 22,000,000",
        period: "Q2 2025",
      },
    ],
    testimonials: [
      {
        quote: "Laila helped us acquire our family lagoon retreat in El Gouna with full escrow security. Top tier professional.",
        client: "Marc Leclerc",
        title: "Geneva / El Gouna Resident",
      },
    ],
  },
  "sherif-hany": {
    id: "sherif-hany",
    name: "Sherif Hany",
    role: "New Capital Sovereign Desk Lead",
    desk: "Institutional Real Estate · New Capital",
    license: "License #EG-2023-0887",
    image: "/images/phone.jpg",
    rating: 4.91,
    reviews: 31,
    vol: "EGP 1.15B",
    deals: 31,
    activeCount: 12,
    response: "12 Mins",
    pills: [
      "New Capital Diplomatic Desk",
      "CBD Commercial Lead",
      "HAPTown Certified",
      "Developer Direct Allocation",
    ],
    bio: "Sherif oversees institutional and government-adjacent real estate transactions across the New Administrative Capital and Mostakbal City. He provides sovereign entities, family funds, and executives with high-conviction insights on infrastructure delivery schedules and title registration.",
    territoryPillar: "New Administrative Capital & Mostakbal City masterplans.",
    allocationsPillar: "Direct institutional ties with Talaat Moustafa Group, Hassan Allam, and SODIC.",
    whatsapp: "201000000000",
    portfolio: [
      {
        id: "p1",
        title: "HAPTown Parkside Standalone Villa",
        corridor: "Mostakbal City · HAPTown",
        priceEgp: "EGP 21,800,000",
        specs: "360 m² · 4 Beds · 4 Baths",
        image: "/images/11.jpg",
        href: "/search?corridor=new-cairo",
      },
    ],
    settlements: [
      {
        assetClass: "CBD Corporate Sky Suite",
        compound: "New Administrative Capital",
        settlementEgp: "EGP 18,500,000",
        period: "Q4 2025",
      },
    ],
    testimonials: [
      {
        quote: "Sherif provided audited milestone verification that gave our investment committee complete confidence in the New Capital corridor.",
        client: "Tarek Foda",
        title: "Chief Investment Officer, Apex Holdings",
      },
    ],
  },
  "dina-farouk": {
    id: "dina-farouk",
    name: "Dina Farouk",
    role: "Katameya Private Desk Lead",
    desk: "Boutique Estates Desk · Katameya Heights",
    license: "License #EG-2024-0542",
    image: "/images/2.jpg",
    rating: 4.94,
    reviews: 29,
    vol: "EGP 1.30B",
    deals: 29,
    activeCount: 8,
    response: "10 Mins",
    pills: [
      "Katameya Heights Partner",
      "SODIC Signature",
      "Boutique Estates",
      "Off-Market Desk",
    ],
    bio: "Dina represents heritage golf estates and boutique private compounds in Katameya Heights and Katameya Dunes. Renowned for rigorous discretion and off-market mandate negotiation, she works directly with private family principals seeking bespoke legacy real estate.",
    territoryPillar: "Katameya Heights, Katameya Dunes & Zamalek private listings.",
    allocationsPillar: "Exclusive representation rights within Katameya's gated golf enclaves.",
    whatsapp: "201000000000",
    portfolio: [
      {
        id: "p1",
        title: "Katameya Heights Golf Signature Villa",
        corridor: "New Cairo · Katameya Heights",
        priceEgp: "EGP 46,000,000",
        specs: "650 m² · 6 Beds · 7 Baths",
        image: "/images/9.jpg",
        href: "/search?corridor=new-cairo",
      },
    ],
    settlements: [
      {
        assetClass: "Katameya Dunes Fairway Villa",
        compound: "Fifth Settlement, New Cairo",
        settlementEgp: "EGP 33,000,000",
        period: "Q3 2025",
      },
    ],
    testimonials: [
      {
        quote: "Dina's discreet handling of our Katameya Heights acquisition was second to none. Her knowledge of title history is peerless.",
        client: "Karim Mansoor",
        title: "Private Investor",
      },
    ],
  },
};

// Available dates for booking
const SCHEDULER_DAYS = [
  { day: "Wed", date: "11" },
  { day: "Thu", date: "12" },
  { day: "Fri", date: "13" },
  { day: "Sat", date: "14" },
  { day: "Sun", date: "15" },
];

const SCHEDULER_SLOTS = ["10:30 AM", "01:00 PM", "04:30 PM", "07:00 PM"];

export default function AgentProfilePage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const currentId = unwrappedParams.id;

  // Resolve advisor data or fallback
  const advisor = ADVISORS_DATA[currentId] || ADVISORS_DATA["karim-el-sayed"];

  // Interactive scheduler state
  const [selectedDay, setSelectedDay] = useState("11");
  const [selectedSlot, setSelectedSlot] = useState("10:30 AM");

  // Console quick mandate form state
  const [mandateName, setMandateName] = useState("");
  const [mandateContact, setMandateContact] = useState("");
  const [mandateBudget, setMandateBudget] = useState("50-100");
  const [mandateSubmitted, setMandateSubmitted] = useState(false);

  // Representation briefing modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalContact, setModalContact] = useState("");
  const [modalModality, setModalModality] = useState("onsite");
  const [modalNotes, setModalNotes] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMandateSubmitted(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalSuccess(false);
  };

  return (
    <div className="profile-page-wrapper">
      {/* 1. Sub-Header Breadcrumb & Quick Switcher Strip */}
      <div className="profile-sub-strip">
        <div className="profile-sub-inner">
          <div className="profile-breadcrumbs">
            <Link href="/">Settly</Link>
            <span className="sep">/</span>
            <Link href="/agents">Certified Advisors</Link>
            <span className="sep">/</span>
            <span className="current">{advisor.name}</span>
          </div>

          <div className="advisor-switcher-wrap">
            <span className="advisor-switcher-label">View Dossier:</span>
            <select
              className="advisor-switcher-select"
              aria-label="Switch Advisor Dossier"
              value={advisor.id}
              onChange={(e) => router.push(`/agents/${e.target.value}`)}
            >
              <option value="karim-el-sayed">Karim El-Sayed (New Cairo · Villas)</option>
              <option value="nourhan-mansour">Nourhan Mansour (West Cairo · Penthouses)</option>
              <option value="tarek-el-gazzar">Tarek El-Gazzar (Ras El Hekma · Coastal)</option>
              <option value="laila-el-kady">Laila El-Kady (Red Sea · El Gouna)</option>
              <option value="sherif-hany">Sherif Hany (New Capital · Sovereign)</option>
              <option value="dina-farouk">Dina Farouk (Katameya · Boutique Estates)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Executive Dossier Header Stage */}
      <section className="dossier-hero">
        <div className="dossier-hero-inner">
          <div className="dossier-card-top">
            <div className="dossier-avatar-box">
              <Image
                src={advisor.image}
                alt={advisor.name}
                width={170}
                height={210}
                priority
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
              <div className="dossier-badge-verified">
                <ShieldCheck size={12} strokeWidth={2.5} />
                Settly Verified
              </div>
              <div className="dossier-license-tag">{advisor.license}</div>
            </div>

            <div className="dossier-meta">
              <div className="dossier-title-row">
                <h1 className="dossier-name">{advisor.name}</h1>
                <div className="dossier-rating-chip">
                  <Star size={13} fill="#C69749" color="#C69749" />
                  <span>{advisor.rating.toFixed(2)}</span>
                  <span style={{ fontSize: "11px", opacity: 0.7 }}>
                    ({advisor.reviews} reviews)
                  </span>
                </div>
              </div>

              <div className="dossier-role-line">{advisor.role}</div>
              <div className="dossier-desk-line">{advisor.desk}</div>

              <div className="dossier-pills-row">
                {advisor.pills.map((pill, idx) => (
                  <span
                    key={idx}
                    className={`dossier-pill ${idx < 2 ? "dev-accredited" : ""}`}
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <div className="dossier-cta-cluster">
                <button
                  type="button"
                  className="btn-dossier-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  <MessageSquare size={15} />
                  Schedule Advisory Briefing
                </button>
                <Link
                  href={`/search?agent=${advisor.id}`}
                  className="btn-dossier-secondary"
                >
                  View Active Mandates ({advisor.activeCount})
                </Link>
              </div>
            </div>
          </div>

          <div className="dossier-telemetry-bar">
            <div className="dossier-metric-item">
              <div className="dossier-metric-val">{advisor.vol}</div>
              <div className="dossier-metric-lbl">Audited Lifetime Volume</div>
            </div>
            <div className="dossier-metric-item">
              <div className="dossier-metric-val">{advisor.deals} Deals</div>
              <div className="dossier-metric-lbl">Closed Title Settlements</div>
            </div>
            <div className="dossier-metric-item">
              <div className="dossier-metric-val">{advisor.activeCount} Active</div>
              <div className="dossier-metric-lbl">Exclusive Listings</div>
            </div>
            <div className="dossier-metric-item">
              <div className="dossier-metric-val">{advisor.response}</div>
              <div className="dossier-metric-lbl">Median Response SLA</div>
            </div>
            <div className="dossier-metric-item">
              <div className="dossier-metric-val">100% Verified</div>
              <div className="dossier-metric-lbl">Deposit Protection</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main 2-Column Workspace (68% / 32%) */}
      <main className="dossier-workspace">
        <div className="dossier-grid-layout">
          {/* Left Column (68% Content) */}
          <div className="dossier-main-col">
            {/* Executive Biography & Investment Thesis */}
            <section className="dossier-section-block">
              <h2>Executive Biography &amp; Investment Thesis</h2>
              <p>{advisor.bio}</p>

              <div className="bio-pillars-grid">
                <div className="bio-pillar-card">
                  <h3>Corridor Focus</h3>
                  <p>{advisor.territoryPillar}</p>
                </div>
                <div className="bio-pillar-card">
                  <h3>Direct Allocation Rights</h3>
                  <p>{advisor.allocationsPillar}</p>
                </div>
                <div className="bio-pillar-card">
                  <h3>Confidentiality SLA</h3>
                  <p>
                    Strict non-disclosure agreements (NDAs) and private off-market registry access for HNW acquisitions.
                  </p>
                </div>
              </div>
            </section>

            {/* Active Exclusive Portfolio */}
            <section className="dossier-section-block">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2>Active Exclusive Portfolio ({advisor.portfolio.length})</h2>
                <span style={{ fontFamily: "var(--mono-ui)", fontSize: "11.5px", color: "var(--ink-3)" }}>
                  Audited Handover Timelines
                </span>
              </div>

              <div className="portfolio-cards-grid">
                {advisor.portfolio.map((item) => (
                  <Link key={item.id} href={item.href} className="portfolio-card">
                    <div className="portfolio-img-box">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={400}
                        height={240}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                      <div className="portfolio-price-chip">{item.priceEgp}</div>
                    </div>
                    <div className="portfolio-details">
                      <div className="portfolio-loc">{item.corridor}</div>
                      <h3 className="portfolio-title">{item.title}</h3>
                      <div className="portfolio-specs-row">
                        <span>{item.specs}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Audited Historical Transaction Ledger */}
            <section className="dossier-section-block">
              <h2>Recent Audited Settlements Ledger</h2>
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Asset Class</th>
                      <th>Compound / Corridor</th>
                      <th>Audited Settlement</th>
                      <th>Period</th>
                      <th>Escrow Rail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisor.settlements.map((tx, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{tx.assetClass}</strong>
                        </td>
                        <td>{tx.compound}</td>
                        <td>
                          <span className="table-mono">{tx.settlementEgp}</span>
                        </td>
                        <td>
                          <span className="table-mono">{tx.period}</span>
                        </td>
                        <td>
                          <span className="status-pill-verified">
                            <Check size={11} strokeWidth={3} /> Verified Deposit Protection
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Client Testimonials */}
            {advisor.testimonials.length > 0 && (
              <section className="dossier-section-block">
                <h2>Fiduciary Client Endorsements</h2>
                <div className="testimonials-grid">
                  {advisor.testimonials.map((t, idx) => (
                    <div key={idx} className="testimonial-card">
                      <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                      <div className="testimonial-client">
                        <span className="client-name">{t.client}</span>
                        <span className="client-meta">{t.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (32% Sticky Action Console) */}
          <aside className="dossier-console">
            <div className="console-hdr">
              <h3>Advisory Console</h3>
              <div className="console-status-pill">
                <span className="console-status-dot"></span>
                Active Now
              </div>
            </div>

            <div className="console-body">
              <button
                type="button"
                className="btn-console-whatsapp"
                onClick={() => setIsModalOpen(true)}
              >
                <MessageSquare size={15} />
                Request Private Advisory Briefing
              </button>

              <div className="console-divider">Or Book Advisory Session</div>

              {/* Viewing & Briefing Scheduler */}
              <div>
                <div className="scheduler-title">Select Date (Cairo CLT)</div>
                <div className="scheduler-days">
                  {SCHEDULER_DAYS.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      className={`scheduler-day-btn ${selectedDay === d.date ? "active" : ""}`}
                      onClick={() => setSelectedDay(d.date)}
                    >
                      <span>{d.day}</span>
                      <strong>{d.date}</strong>
                    </button>
                  ))}
                </div>

                <div className="scheduler-title">Available Time Slot</div>
                <div className="scheduler-slots">
                  {SCHEDULER_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`scheduler-slot-btn ${selectedSlot === slot ? "active" : ""}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mandate Submission Form */}
              {mandateSubmitted ? (
                <div
                  style={{
                    background: "rgba(61, 90, 76, 0.08)",
                    border: "1px solid rgba(61, 90, 76, 0.2)",
                    borderRadius: "10px",
                    padding: "1.25rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "var(--sage)",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 8px",
                    }}
                  >
                    <Check size={18} />
                  </div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--navy-900)" }}>
                    Briefing Reserved
                  </h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-2)", lineHeight: 1.4 }}>
                    Dispatched to {advisor.name}. You will receive WhatsApp confirmation within {advisor.response}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConsoleSubmit}>
                  <div className="console-form-group" style={{ marginBottom: "10px" }}>
                    <label htmlFor="cInvestorName">Investor / Principal Name</label>
                    <input
                      type="text"
                      id="cInvestorName"
                      className="console-input"
                      placeholder="e.g. Tarek Mansour"
                      value={mandateName}
                      onChange={(e) => setMandateName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="console-form-group" style={{ marginBottom: "10px" }}>
                    <label htmlFor="cInvestorContact">WhatsApp or Email</label>
                    <input
                      type="text"
                      id="cInvestorContact"
                      className="console-input"
                      placeholder="+20 100 000 0000"
                      value={mandateContact}
                      onChange={(e) => setMandateContact(e.target.value)}
                      required
                    />
                  </div>

                  <div className="console-form-group" style={{ marginBottom: "10px" }}>
                    <label htmlFor="cInvestorBudget">Acquisition Budget Bracket</label>
                    <select
                      id="cInvestorBudget"
                      className="console-select"
                      value={mandateBudget}
                      onChange={(e) => setMandateBudget(e.target.value)}
                      required
                    >
                      <option value="20-50">EGP 20M — 50M</option>
                      <option value="50-100">EGP 50M — 100M</option>
                      <option value="100-250">EGP 100M — 250M</option>
                      <option value="250+">EGP 250M+ (Portfolio)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-console-submit">
                    Confirm Confidential Briefing
                  </button>
                </form>
              )}

              <div className="console-legal-seal">
                <Lock size={14} style={{ flexShrink: 0, marginTop: "1px", color: "var(--brass-600)" }} />
                <span>
                  Verified Listing Protection. All transactions and client communications are kept strictly confidential.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* 4. Representation Mandate Modal */}
      {isModalOpen && (
        <div
          className="modal-backdrop open"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Schedule Private Advisory Briefing</h3>
                <p>
                  Confidential consultation with <strong>{advisor.name}</strong>
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close modal"
                onClick={closeModal}
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {modalSuccess ? (
              <div className="modal-success-state" style={{ display: "block" }}>
                <div className="modal-success-icon">
                  <Check size={28} strokeWidth={2.5} />
                </div>
                <h3 style={{ fontFamily: "var(--serif-heading)", fontSize: "22px", margin: "0 0 8px", color: "var(--navy-900)" }}>
                  Briefing Scheduled
                </h3>
                <p style={{ fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
                  Your confidential session has been requested. An encrypted calendar invite and briefing dossier will arrive within {advisor.response}.
                </p>
                <button
                  type="button"
                  className="btn-dossier-primary"
                  style={{ margin: "0 auto", display: "inline-flex" }}
                  onClick={closeModal}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit}>
                <div className="modal-body">
                  <div className="console-form-group">
                    <label htmlFor="mName">Investor / Principal Name</label>
                    <input
                      type="text"
                      id="mName"
                      className="console-input"
                      placeholder="e.g. Laila Farid"
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="console-form-group">
                    <label htmlFor="mContact">Email Address or Phone Number</label>
                    <input
                      type="text"
                      id="mContact"
                      className="console-input"
                      placeholder="+20 100 000 0000 or email@domain.com"
                      value={modalContact}
                      onChange={(e) => setModalContact(e.target.value)}
                      required
                    />
                  </div>

                  <div className="console-form-group">
                    <label htmlFor="mFormat">Meeting Modality</label>
                    <select
                      id="mFormat"
                      className="console-select"
                      value={modalModality}
                      onChange={(e) => setModalModality(e.target.value)}
                    >
                      <option value="onsite">Private On-Site Residence Viewing</option>
                      <option value="lounge">Settly Private Lounge (Katameya)</option>
                      <option value="zoom">Encrypted Zoom Video Briefing</option>
                    </select>
                  </div>

                  <div className="console-form-group">
                    <label htmlFor="mNotes">Confidential Acquisition Parameters (Optional)</label>
                    <textarea
                      id="mNotes"
                      className="console-input"
                      rows={2}
                      placeholder="Specific developer preference, plot size, or handover target..."
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-dossier-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-dossier-primary">
                    Confirm Briefing
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
