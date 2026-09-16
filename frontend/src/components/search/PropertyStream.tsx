"use client";

import React, { useState } from "react";
import { PropertyCard, PropertyItem } from "./PropertyCard";

interface PropertyStreamProps {
  properties: PropertyItem[];
  selectedId: string | null;
  onHoverProperty: (id: string | null) => void;
  onClickProperty: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onClearAll?: () => void;
}

export function PropertyStream({
  properties,
  selectedId,
  onHoverProperty,
  onClickProperty,
  favorites,
  onToggleFavorite,
  onClearAll,
}: PropertyStreamProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const totalCount = properties.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const startIdx = (currentPage - 1) * pageSize;
  const paginatedProps = properties.slice(startIdx, startIdx + pageSize);

  return (
    <main className="search-stream-col">
      {totalCount === 0 ? (
        <div className="stream-empty-state" role="status">
          <div className="empty-state-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h3>No residences match this criteria</h3>
          <p>
            No properties found matching your active filters. Try adjusting your
            price ceiling, micro-market selections, or property types.
          </p>
          {onClearAll && (
            <button
              type="button"
              className="empty-state-reset-btn"
              onClick={onClearAll}
            >
              Reset all criteria
            </button>
          )}
        </div>
      ) : (
        <div className="stream-grid" id="streamGrid">
          {paginatedProps.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isSelected={selectedId === prop.id}
              onHover={onHoverProperty}
              onClick={onClickProperty}
              isFavorite={favorites.includes(prop.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Monospace Cursor Pagination */}
      {totalCount > 0 && (
        <div className="stream-pagination">
        <span>
          Showing {totalCount > 0 ? startIdx + 1 : 0}–
          {Math.min(startIdx + pageSize, totalCount)} of {totalCount} verified
          residences
        </span>
        <div className="page-btns">
          <button
            type="button"
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ‹ Prev
          </button>
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx + 1}
              type="button"
              className={`page-btn ${currentPage === idx + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          <button
            type="button"
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next ›
          </button>
        </div>
      </div>
      )}
    </main>
  );
}
