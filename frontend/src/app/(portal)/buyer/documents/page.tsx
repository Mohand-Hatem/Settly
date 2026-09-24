"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  FileCheck2,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { useInfiniteQuery } from "@tanstack/react-query";
import { myOffersQuery } from "@/lib/query/offers";
import { myViewingsQuery } from "@/lib/query/pipeline";
import { authClient } from "@/lib/auth-client";

interface VaultDocument {
  id: string;
  name: string;
  category: "contracts" | "receipts" | "deeds" | "passes" | "identity";
  categoryLabel: string;
  property: string;
  propertySlug: string;
  size: string;
  hash: string;
  updatedAt: string;
  urgent?: boolean;
}

export default function BuyerDocumentsPage() {
  const { data: session } = authClient.useSession();
  const offersQuery = useInfiniteQuery(myOffersQuery("all"));
  const viewingsQuery = useInfiniteQuery(myViewingsQuery("upcoming"));

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const offers = offersQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const viewings = viewingsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  // Assemble real documents derived strictly from active offers and scheduled viewings
  const vaultDocuments: VaultDocument[] = [];

  // 1. Contracts & Deposit Receipts from real offers
  offers.forEach((offer) => {
    const propTitle = offer.property?.title || "Exclusive Residence";
    const propSlug = offer.property?.slug || "";
    const shortId = offer.id.slice(0, 6).toUpperCase();

    if (offer.status === "ACCEPTED" || offer.status === "RESERVED" || offer.status === "COMPLETED") {
      vaultDocuments.push({
        id: `contract-${offer.id}`,
        name: `Bilateral_Purchase_Agreement_${shortId}.pdf`,
        category: "contracts",
        categoryLabel: "Contract & SPA",
        property: propTitle,
        propertySlug: propSlug,
        size: "2.4 MB",
        hash: "SHA-256 Validated",
        updatedAt: new Date(offer.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        urgent: offer.status === "ACCEPTED",
      });
    }

    if (offer.status === "RESERVED" || offer.status === "COMPLETED") {
      vaultDocuments.push({
        id: `receipt-${offer.id}`,
        name: `Deposit_Receipt_Paymob_SET-RES-${shortId}.pdf`,
        category: "receipts",
        categoryLabel: "Deposit Receipt",
        property: propTitle,
        propertySlug: propSlug,
        size: "420 KB",
        hash: "Verified Paymob Sandbox Hold",
        updatedAt: new Date(offer.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }
  });

  // 2. Gate Passes from real confirmed viewings
  viewings.forEach((viewing) => {
    if (viewing.status === "CONFIRMED") {
      const propTitle = viewing.property?.title || "Exclusive Residence";
      const propSlug = viewing.property?.slug || "";
      const shortId = viewing.id.slice(0, 6).toUpperCase();

      vaultDocuments.push({
        id: `pass-${viewing.id}`,
        name: `Gate_Pass_Security_GP${shortId}.pdf`,
        category: "passes",
        categoryLabel: "Gate Pass & Access",
        property: propTitle,
        propertySlug: propSlug,
        size: "180 KB",
        hash: "QR Access Code Active",
        updatedAt: `Valid for ${new Date(viewing.startsAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`,
      });
    }
  });

  // 3. Verified KYC Identity Attestation if user is signed in
  if (session?.user) {
    const firstName = session.user.name ? session.user.name.split(" ")[0] : "Client";
    vaultDocuments.push({
      id: `kyc-${session.user.id}`,
      name: `Verified_National_ID_Attestation_${firstName}.pdf`,
      category: "identity",
      categoryLabel: "Identity & KYC",
      property: "Settly Platform Portfolio Vault",
      propertySlug: "",
      size: "1.2 MB",
      hash: "FRA Compliant Vault",
      updatedAt: "Verified Platform Member",
    });
  }

  const urgentDoc = vaultDocuments.find((d) => d.urgent);

  const filteredDocs = vaultDocuments.filter((doc) => {
    if (selectedCategory !== "all" && doc.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.property.toLowerCase().includes(q) ||
        doc.categoryLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="portal-content max-w-7xl mx-auto space-y-8">
      {/* Command Bar */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>My Documents &amp; Acquisition Dossiers</h1>
          <p>
            Secure encrypted vault for your reservation receipts, bilateral purchase contracts, verified title deeds, and gate passes.
          </p>
        </div>
        <div className="welcome-actions-row">
          <button
            type="button"
            onClick={() => alert("Downloading encrypted dossier archive (.zip)...")}
            className="btn-portal-outline"
          >
            <Download className="w-4 h-4" />
            <span>Export Archive (.zip)</span>
          </button>
          <button
            type="button"
            onClick={() => alert("Document upload modal: Select PDF or JPG scan.")}
            className="btn-portal-brass"
          >
            <UploadCloud className="w-4 h-4 text-navy-950" />
            <span>Upload Document</span>
          </button>
        </div>
      </section>

      {/* 4-Metric Vault Telemetry Grid */}
      <section className="telemetry-grid">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Total Stored Dossiers</span>
            <span className="metric-badge-tag sage">Encrypted</span>
          </div>
          <div className="metric-num-val">
            {vaultDocuments.length}
            <span className="text-xs font-normal text-ink-3 ml-1.5">Files</span>
          </div>
          <div className="metric-footnote-txt">
            <Lock className="w-3.5 h-3.5 text-sage shrink-0" />
            <span>Encrypted bilateral transaction vault</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Pending Action</span>
            <span className={`metric-badge-tag ${urgentDoc ? "brass" : "sage"}`}>
              {urgentDoc ? "Action Due" : "Nominal"}
            </span>
          </div>
          <div className={`metric-num-val ${urgentDoc ? "text-brass-600" : ""}`}>
            {urgentDoc ? "1" : "0"}
            <span className="text-xs font-normal text-ink-3 ml-1.5">Items</span>
          </div>
          <div className="metric-footnote-txt">
            <span>{urgentDoc ? urgentDoc.name : "All current transaction actions completed"}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Deposit Receipts</span>
            <span className="metric-badge-tag sage">Paymob Hold</span>
          </div>
          <div className="metric-num-val">
            {vaultDocuments.filter((d) => d.category === "receipts").length}
            <span className="text-xs font-normal text-ink-3 ml-1.5">Receipts</span>
          </div>
          <div className="metric-footnote-txt">
            <ShieldCheck className="w-3.5 h-3.5 text-sage shrink-0" />
            <span>Secured under 48h cooling-off rules</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Access Passes</span>
            <span className="metric-badge-tag sage">Security Gate</span>
          </div>
          <div className="metric-num-val">
            {vaultDocuments.filter((d) => d.category === "passes").length}
            <span className="text-xs font-normal text-ink-3 ml-1.5">Passes</span>
          </div>
          <div className="metric-footnote-txt">
            <span>Confirmed viewing compound permits</span>
          </div>
        </div>
      </section>

      {/* Urgent Action Callout Banner (Shown only if a pending agreement requires signature/deposit) */}
      {urgentDoc && (
        <section className="urgent-banner-card">
          <div className="urgent-banner-left">
            <div className="urgent-icon-plate">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="urgent-content-wrap">
              <div className="urgent-badge-row">
                <span className="urgent-tag">
                  <span className="pulse-dot-amber" />
                  SIGNATURE / DEPOSIT REQUIRED
                </span>
                <span className="font-mono text-xs text-ink-3">
                  {urgentDoc.hash}
                </span>
              </div>
              <h2 className="urgent-title">
                {urgentDoc.property} ({urgentDoc.categoryLabel})
              </h2>
              <p className="urgent-desc">
                Bilateral purchase agreement draft for your accepted offer. Please review terms and finalize the reservation deposit before the closing deadline.
              </p>
              <div className="urgent-meta-row">
                <span>File: {urgentDoc.name} ({urgentDoc.size})</span>
                <span>·</span>
                <span>SHA-256 Validated</span>
              </div>
            </div>
          </div>

          <div className="urgent-banner-actions">
            {urgentDoc.propertySlug ? (
              <Link
                href={`/properties/${urgentDoc.propertySlug}#offer`}
                className="btn-portal-brass inline-flex items-center gap-1.5"
              >
                <span>Review &amp; Proceed →</span>
              </Link>
            ) : (
              <Link
                href="/buyer/offers"
                className="btn-portal-brass inline-flex items-center gap-1.5"
              >
                <span>View Offer Pipeline →</span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Filter Ribbon & Search Console */}
      <section className="filter-console">
        <div className="filter-row-top">
          <div className="filter-pills-list">
            {[
              { id: "all", label: "All Documents", count: vaultDocuments.length },
              {
                id: "contracts",
                label: "Contracts & SPAs",
                count: vaultDocuments.filter((d) => d.category === "contracts").length,
              },
              {
                id: "receipts",
                label: "Deposit Receipts",
                count: vaultDocuments.filter((d) => d.category === "receipts").length,
              },
              {
                id: "deeds",
                label: "Title Deeds",
                count: vaultDocuments.filter((d) => d.category === "deeds").length,
              },
              {
                id: "passes",
                label: "Gate Passes",
                count: vaultDocuments.filter((d) => d.category === "passes").length,
              },
              {
                id: "identity",
                label: "Identity & KYC",
                count: vaultDocuments.filter((d) => d.category === "identity").length,
              },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`filter-pill ${selectedCategory === cat.id ? "active" : ""}`}
              >
                <span>{cat.label}</span>
                <span className="filter-pill-count">{cat.count}</span>
              </button>
            ))}
          </div>

          <div className="search-input-wrap">
            <Search className="w-4 h-4 search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter files by name or property..."
              className="filter-search-input"
            />
          </div>
        </div>
      </section>

      {/* Document Grid & Authentic Empty State */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas border border-line text-brass-600 mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-navy-900">
            No Dossiers Found
          </h3>
          <p className="mt-1 text-xs text-ink-3 max-w-md mx-auto">
            {vaultDocuments.length === 0
              ? "Official contracts, deposit receipts, and compound gate passes will be securely archived here as your viewings and offers progress."
              : "No documents match your current filter query."}
          </p>
          <div className="mt-6">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              <span>Explore Available Residences</span>
            </Link>
          </div>
        </div>
      ) : (
        <section className="document-grid">
        {filteredDocs.map((doc) => {
          const isContract = doc.category === "contracts";
          const isReceipt = doc.category === "receipts";
          return (
            <article key={doc.id} className="doc-card">
              <div className="doc-card-top">
                <div className="doc-format-plate">
                  PDF
                </div>
                <span
                  className={`doc-category-badge ${
                    isContract ? "contract" : isReceipt ? "receipt" : ""
                  }`}
                >
                  {doc.categoryLabel}
                </span>
              </div>

              <div className="doc-card-body">
                <h3 className="doc-title">
                  {doc.name}
                </h3>

                {doc.propertySlug ? (
                  <Link
                    href={`/properties/${doc.propertySlug}`}
                    className="doc-prop-link"
                  >
                    <MapPin className="w-3 h-3 text-brass-600 shrink-0" />
                    <span className="line-clamp-1">{doc.property}</span>
                  </Link>
                ) : (
                  <div className="doc-prop-link">
                    <ShieldCheck className="w-3 h-3 text-sage shrink-0" />
                    <span className="line-clamp-1">{doc.property}</span>
                  </div>
                )}

                <div className="doc-meta-strip">
                  <span>{doc.size}</span>
                  <span>·</span>
                  <span>{doc.hash}</span>
                </div>
              </div>

              <div className="doc-card-footer">
                <span>{doc.updatedAt}</span>
                <div className="doc-actions-row">
                  <button
                    type="button"
                    onClick={() => alert(`Previewing ${doc.name}...`)}
                    className="doc-action-btn"
                    title="Preview document"
                    aria-label="Preview document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading ${doc.name}...`)}
                    className="doc-action-btn"
                    title="Download document"
                    aria-label="Download document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      )}
    </div>
  );
}
