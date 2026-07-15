type Gender = "male" | "female";
type Relationship = "married" | "siblings" | "none";

interface GenderValidationResult {
  allowed: boolean;
  reason?: string;
  requiresRelationship?: boolean;
}

export function validateGenderSharing(
  inviterGender: Gender,
  inviteeGender: Gender,
  relationship?: Relationship
): GenderValidationResult {
  if (inviterGender === inviteeGender) {
    return { allowed: true };
  }

  if (!relationship) {
    return {
      allowed: false,
      reason: "Relationship required for opposite gender sharing",
      requiresRelationship: true,
    };
  }

  if (relationship === "married" || relationship === "siblings") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Opposite genders cannot share unless married or siblings",
  };
}
