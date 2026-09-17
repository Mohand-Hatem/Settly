"use client";

import React, { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";

export interface ImageWithFallbackProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackSrc?: string;
}

/**
 * next/image that swaps to a placeholder when the source is missing or fails to load
 * (deleted Cloudinary asset, bad path). Swaps once, so a broken fallback cannot loop.
 */
export function ImageWithFallback({
  src,
  fallbackSrc = PLACEHOLDER_PROPERTY_IMAGE,
  alt,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const requested = src || fallbackSrc;
  // Remember which source failed rather than a boolean, so a new src prop resets the state
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const effectiveSrc = failedSrc === requested ? fallbackSrc : requested;

  return (
    <Image
      {...props}
      src={effectiveSrc}
      alt={alt}
      onError={(e) => {
        if (effectiveSrc !== fallbackSrc) setFailedSrc(requested);
        onError?.(e);
      }}
    />
  );
}
