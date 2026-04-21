import type {
  CourtStatus,
  CourtSurface,
  DivisionCategory,
  DominantHand,
  Gender,
  MembershipStatus,
  PadelLevel,
  TournamentFormat,
  TournamentStatus,
  TournamentType,
} from "./types";

export const PADEL_LEVELS: PadelLevel[] = [
  "D",
  "D+",
  "C-",
  "C",
  "C+",
  "B-",
  "B",
  "B+",
  "A",
  "OPEN",
];

export const DEFAULT_ELO_BY_LEVEL: Record<PadelLevel, number> = {
  D: 750,
  "D+": 850,
  "C-": 950,
  C: 1050,
  "C+": 1150,
  "B-": 1275,
  B: 1425,
  "B+": 1600,
  A: 1850,
  OPEN: 2050,
};

export const FORMAT_LABEL_RU: Record<TournamentFormat, string> = {
  americano: "Американо",
  team_americano: "Командное американо",
  mexicano: "Мексикано",
  team_mexicano: "Командное мексикано",
  round_robin: "Круговой",
  escalera: "Эскалера",
};

export const STATUS_LABEL_RU: Record<TournamentStatus, string> = {
  draft: "Черновик",
  registration_open: "Регистрация открыта",
  in_progress: "В процессе",
  completed: "Завершён",
};

export const TYPE_LABEL_RU: Record<TournamentType, string> = {
  one_day: "Один день",
  league_season: "Сезон лиги",
};

export const COURT_SURFACE_LABEL_RU: Record<CourtSurface, string> = {
  artificial_grass: "Искусственная трава",
  grass: "Натуральная трава",
  concrete: "Бетон",
  carpet: "Ковёр",
};

export const COURT_STATUS_LABEL_RU: Record<CourtStatus, string> = {
  active: "Активный",
  maintenance: "На обслуживании",
};

export const GENDER_LABEL_RU: Record<Gender, string> = {
  male: "Мужской",
  female: "Женский",
  other: "Другой",
};

export const MEMBERSHIP_LABEL_RU: Record<MembershipStatus, string> = {
  member: "Член клуба",
  non_member: "Не член клуба",
  guest: "Гость",
};

export const DOMINANT_HAND_LABEL_RU: Record<DominantHand, string> = {
  right: "Правая",
  left: "Левая",
};

export const DIVISION_CATEGORY_LABEL_RU: Record<DivisionCategory, string> = {
  mens: "Мужчины",
  womens: "Женщины",
  mixed: "Микст",
  open: "Открытый",
};
