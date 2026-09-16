import { Router } from "express";
import { areaRouter } from "./area.routes.js";
import { propertyRouter } from "./property.routes.js";
import { amenityRouter } from "./amenity.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { compareRouter } from "./compare.routes.js";

export const catalogRouter: Router = Router();

catalogRouter.get("/health", (_req, res) => {
  res.json({ module: "catalog", status: "ok" });
});

catalogRouter.use("/areas", areaRouter);
catalogRouter.use("/properties", propertyRouter);
catalogRouter.use("/amenities", amenityRouter);
catalogRouter.use("/uploads", uploadRouter);
catalogRouter.use("/compare", compareRouter);

export { areaRouter, propertyRouter, amenityRouter, uploadRouter, compareRouter };
export { adminPropertyRouter, myPropertyRouter } from "./property.routes.js";
