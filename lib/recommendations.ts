export type RecommendationPreferences = {
  city?: string;
  locality?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  furnishing?: string;
  amenities?: string[];
  parking?: boolean;
};

export type RecommendationProperty = {
  id: string;
  city: string;
  locality: string;
  monthlyRent: number;
  bedrooms: number;
  furnishing: string;
  parking: boolean;
  amenities: {
    amenity: {
      name: string;
    };
  }[];
};

export type PropertyMatch = {
  matchPercentage: number;
  reasons: string[];
};

const weights = {
  city: 25,
  locality: 10,
  budget: 30,
  bedrooms: 15,
  furnishing: 10,
  amenities: 5,
  parking: 5,
};

export function calculatePropertyMatch(
  property: RecommendationProperty,
  preferences: RecommendationPreferences
): PropertyMatch {
  let earnedScore = 0;
  let totalWeight = 0;
  const reasons: string[] = [];

  function addScore(weight: number, score: number, reason: string) {
    totalWeight += weight;
    earnedScore += weight * score;

    if (score > 0 && reason) {
      reasons.push(reason);
    }
  }

  if (preferences.city?.trim()) {
    const matches =
      property.city.toLowerCase().trim() ===
      preferences.city.toLowerCase().trim();

    addScore(
      weights.city,
      matches ? 1 : 0,
      matches ? `Located in ${property.city}` : ""
    );
  }

  if (preferences.locality?.trim()) {
    const preferred = preferences.locality.toLowerCase().trim();
    const actual = property.locality.toLowerCase().trim();

    const matches =
      actual.includes(preferred) || preferred.includes(actual);

    addScore(
      weights.locality,
      matches ? 1 : 0,
      matches ? `Matches your preferred locality: ${property.locality}` : ""
    );
  }

  if (
    preferences.minRent !== undefined ||
    preferences.maxRent !== undefined
  ) {
    const aboveMinimum =
      preferences.minRent === undefined ||
      property.monthlyRent >= preferences.minRent;

    const belowMaximum =
      preferences.maxRent === undefined ||
      property.monthlyRent <= preferences.maxRent;

    const matches = aboveMinimum && belowMaximum;

    addScore(
      weights.budget,
      matches ? 1 : 0,
      matches
        ? `Rent of ₹${property.monthlyRent.toLocaleString("en-IN")} is within your budget`
        : ""
    );
  }

  if (preferences.bedrooms !== undefined) {
    const matches =
      preferences.bedrooms >= 4
        ? property.bedrooms >= 4
        : property.bedrooms === preferences.bedrooms;

    addScore(
      weights.bedrooms,
      matches ? 1 : 0,
      matches ? `Matches your ${preferences.bedrooms}+ BHK preference` : ""
    );
  }

  if (preferences.furnishing) {
    const matches = property.furnishing === preferences.furnishing;

    addScore(
      weights.furnishing,
      matches ? 1 : 0,
      matches
        ? `Matches your ${preferences.furnishing.toLowerCase().replace("_", " ")} preference`
        : ""
    );
  }

  if (preferences.amenities && preferences.amenities.length > 0) {
    const availableAmenities = property.amenities.map((item) =>
      item.amenity.name.toLowerCase().trim()
    );

    const matchedAmenities = preferences.amenities.filter((name) =>
      availableAmenities.includes(name.toLowerCase().trim())
    );

    const score = matchedAmenities.length / preferences.amenities.length;

    addScore(
      weights.amenities,
      score,
      matchedAmenities.length > 0
        ? `Includes ${matchedAmenities.join(", ")}`
        : ""
    );
  }

  if (preferences.parking !== undefined) {
    const matches = property.parking === preferences.parking;

    addScore(
      weights.parking,
      matches ? 1 : 0,
      matches && preferences.parking
        ? "Parking is available"
        : matches
          ? "Matches your parking preference"
          : ""
    );
  }

  const matchPercentage =
    totalWeight > 0
      ? Math.round((earnedScore / totalWeight) * 100)
      : 0;

  if (reasons.length === 0) {
    reasons.push("This property has limited matches with your preferences.");
  }

  return {
    matchPercentage,
    reasons,
  };
}

