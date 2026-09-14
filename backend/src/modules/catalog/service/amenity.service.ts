import * as amenityRepo from "../repository/amenity.repository.js";
import type { AmenityCategory, AmenityItem, CreateAmenityInput } from "../schema/amenity.schema.js";

export async function listAmenities(category?: AmenityCategory): Promise<AmenityItem[]> {
  return await amenityRepo.listAmenities(category);
}

export async function getAmenityById(id: string): Promise<AmenityItem | null> {
  return await amenityRepo.getAmenityById(id);
}

export async function createAmenity(input: CreateAmenityInput): Promise<AmenityItem> {
  return await amenityRepo.createAmenity(input);
}
