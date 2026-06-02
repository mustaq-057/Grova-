/** Pronouns for the other profile (wife = her, me = him). */
export function partnerIsFemale(partnerId: string): boolean {
  return partnerId === "wife";
}

export function partnerHimHer(partnerId: string): "him" | "her" {
  return partnerIsFemale(partnerId) ? "her" : "him";
}

export function partnerHisHer(partnerId: string): "his" | "her" {
  return partnerIsFemale(partnerId) ? "her" : "his";
}

export function partnerHeShe(partnerId: string): "he" | "she" {
  return partnerIsFemale(partnerId) ? "she" : "he";
}

export function partnerTypingLine(partnerId: string, name: string): string {
  return `${name} is typing…`;
}

/** e.g. "Ask her" / "Ask him" */
export function askPartner(partnerId: string): string {
  return `Ask ${partnerHimHer(partnerId)}`;
}

/** e.g. "Her note" / "His note" */
export function partnerPossessiveNote(partnerId: string): string {
  return `${partnerHisHer(partnerId).charAt(0).toUpperCase()}${partnerHisHer(partnerId).slice(1)} note`;
}
