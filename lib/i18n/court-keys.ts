import type { TranslationKey } from "@/lib/i18n";
import type { CourtStatus, CourtSurface } from "@/lib/types";

export const COURT_SURFACE_KEY: Record<CourtSurface, TranslationKey> = {
  artificial_grass: "court.surface.artificial_grass",
  grass: "court.surface.grass",
  concrete: "court.surface.concrete",
  carpet: "court.surface.carpet",
};

export const COURT_STATUS_KEY: Record<CourtStatus, TranslationKey> = {
  active: "court.status.active",
  maintenance: "court.status.maintenance",
};

export const COURT_SURFACE_VALUES: CourtSurface[] = [
  "artificial_grass",
  "grass",
  "concrete",
  "carpet",
];

export const COURT_STATUS_VALUES: CourtStatus[] = ["active", "maintenance"];
