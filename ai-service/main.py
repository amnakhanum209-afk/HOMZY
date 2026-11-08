
from pathlib import Path
import os
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import (
    BaseModel,
    Field,
    StrictBool,
    field_validator,
    model_validator,
)


# =========================================================
# ENVIRONMENT CONFIGURATION
# =========================================================

# Load ai-service/.env without overwriting existing system
# environment variables.
load_dotenv(
    dotenv_path=Path(__file__).with_name(".env"),
    override=False,
)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="HOMZY AI Service",
    description="HOMZY chatbot and property recommendation service",
    version="2.0.8",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# CHATBOT REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Message cannot be empty.")

        return value


# =========================================================
# MODULE 4: RECOMMENDATION MODELS
# =========================================================

class RecommendationPreferences(BaseModel):
    city: Optional[str] = None
    locality: Optional[str] = None

    minRent: Optional[int] = Field(default=None, ge=0)
    maxRent: Optional[int] = Field(default=None, ge=0)

    # 4 means 4 or more bedrooms.
    bedrooms: Optional[int] = Field(default=None, ge=1, le=20)

    propertyType: Optional[str] = None
    furnishing: Optional[str] = None

    amenities: list[str] = Field(default_factory=list)

    parking: Optional[StrictBool] = None

    workplace: Optional[str] = None
    college: Optional[str] = None
    preferredDestination: Optional[str] = None

    maxTravelTime: Optional[int] = Field(
        default=None,
        ge=1,
        le=600,
    )

    otherPreferences: Optional[str] = None

    @model_validator(mode="after")
    def validate_rent_range(self):
        if (
            self.minRent is not None
            and self.maxRent is not None
            and self.minRent > self.maxRent
        ):
            raise ValueError(
                "Minimum rent cannot exceed maximum rent."
            )

        return self


class CandidateProperty(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)

    city: str
    locality: str

    monthlyRent: int = Field(ge=0)
    bedrooms: int = Field(ge=1, le=20)

    propertyType: str
    furnishing: str

    parking: StrictBool

    amenities: list[str] = Field(default_factory=list)
    description: str = ""

    # Only send travel time when verified by a trusted source.
    travelTimeMinutes: Optional[int] = Field(
        default=None,
        ge=0,
    )

    @field_validator("id", mode="before")
    @classmethod
    def validate_property_id(cls, value):
        if isinstance(value, str):
            value = value.strip()

            if not value:
                raise ValueError(
                    "Property ID cannot be empty or whitespace only."
                )

        return value

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Property title cannot be empty or whitespace only."
            )

        return value


class RecommendationRequest(BaseModel):
    preferences: RecommendationPreferences
    candidates: list[CandidateProperty] = Field(max_length=200)

    @model_validator(mode="after")
    def validate_unique_property_ids(self):
        property_ids = [
            property_data.id
            for property_data in self.candidates
        ]

        if len(property_ids) != len(set(property_ids)):
            raise ValueError(
                "Duplicate property IDs are not allowed. "
                "Every candidate must have a unique property ID."
            )

        return self


# =========================================================
# MODULE 4: CONFIGURABLE RECOMMENDATION WEIGHTS
# =========================================================

DEFAULT_WEIGHTS = {
    "budget": 30,
    "location": 25,
    "propertyPreference": 20,
    "amenities": 10,
    "travelTime": 10,
    "otherPreferences": 5,
}


def load_recommendation_weights() -> dict[str, int]:
    """
    Read recommendation weights from ai-service/.env.

    Default weights:
        budget: 30
        location: 25
        propertyPreference: 20
        amenities: 10
        travelTime: 10
        otherPreferences: 5

    All weights must be non-negative whole numbers
    and their total must equal exactly 100.
    """

    weights: dict[str, int] = {}

    for category, default_value in DEFAULT_WEIGHTS.items():

        environment_name = (
            f"HOMZY_WEIGHT_{category.upper()}"
        )

        raw_value = os.getenv(
            environment_name,
            str(default_value),
        ).strip()

        try:
            weight = int(raw_value)

        except ValueError as exc:
            raise RuntimeError(
                f"{environment_name} must be a whole number."
            ) from exc

        if weight < 0:
            raise RuntimeError(
                f"{environment_name} cannot be negative."
            )

        weights[category] = weight

    total_weight = sum(weights.values())

    if total_weight != 100:
        raise RuntimeError(
            "HOMZY recommendation weights must total exactly 100. "
            f"Current total: {total_weight}."
        )

    return weights


WEIGHTS = load_recommendation_weights()


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def contains_text(
    value: Optional[str],
    text: Optional[str],
) -> bool:
    if not value or not text:
        return False

    return text.strip().casefold() in value.casefold()


# =========================================================
# MODULE 4: MATCH CALCULATION
# =========================================================

def calculate_match(
    preferences: RecommendationPreferences,
    property_data: CandidateProperty,
) -> dict:

    scores = {}
    reasons = []
    disadvantages = []

    # -----------------------------------------------------
    # 1. BUDGET
    # -----------------------------------------------------

    budget_score = None

    if (
        preferences.minRent is not None
        or preferences.maxRent is not None
    ):
        minimum = (
            preferences.minRent
            if preferences.minRent is not None
            else 0
        )

        maximum = preferences.maxRent

        rent_is_valid = (
            property_data.monthlyRent >= minimum
            and (
                maximum is None
                or property_data.monthlyRent <= maximum
            )
        )

        budget_score = 100 if rent_is_valid else 0

        if rent_is_valid:
            reasons.append(
                "Monthly rent is within your budget."
            )
        else:
            disadvantages.append(
                "Monthly rent is outside your budget."
            )

    scores["budget"] = budget_score

    # -----------------------------------------------------
    # 2. LOCATION
    # -----------------------------------------------------

    location_parts = []

    if preferences.city:
        city_match = (
            property_data.city.strip().casefold()
            == preferences.city.strip().casefold()
        )

        location_parts.append(100 if city_match else 0)

        if city_match:
            reasons.append(
                "Property is in your preferred city."
            )
        else:
            disadvantages.append(
                "Property is in a different city."
            )

    if preferences.locality:
        locality_match = (
            property_data.locality.strip().casefold()
            == preferences.locality.strip().casefold()
        )

        location_parts.append(100 if locality_match else 0)

        if locality_match:
            reasons.append(
                "Property matches your preferred locality."
            )
        else:
            disadvantages.append(
                "Property is outside your preferred locality."
            )

    scores["location"] = (
        sum(location_parts) / len(location_parts)
        if location_parts
        else None
    )

    # -----------------------------------------------------
    # 3. PROPERTY PREFERENCE
    # -----------------------------------------------------

    property_parts = []

    if preferences.bedrooms is not None:

        # Selecting 4 means 4 BHK or more.
        if preferences.bedrooms == 4:
            bedroom_match = (
                property_data.bedrooms >= 4
            )
        else:
            bedroom_match = (
                property_data.bedrooms == preferences.bedrooms
            )

        property_parts.append(100 if bedroom_match else 0)

        if bedroom_match:
            if preferences.bedrooms == 4:
                reasons.append(
                    "Property has 4 or more bedrooms, "
                    "matching your preference."
                )
            else:
                reasons.append(
                    "Bedroom count matches your preference."
                )
        else:
            disadvantages.append(
                "Bedroom count differs from your preference."
            )

    if preferences.propertyType:
        type_match = (
            property_data.propertyType.strip().casefold()
            == preferences.propertyType.strip().casefold()
        )

        property_parts.append(100 if type_match else 0)

        if type_match:
            reasons.append(
                "Property type matches your preference."
            )
        else:
            disadvantages.append(
                "Property type differs from your preference."
            )

    if preferences.furnishing:
        furnishing_match = (
            property_data.furnishing.strip().casefold()
            == preferences.furnishing.strip().casefold()
        )

        property_parts.append(100 if furnishing_match else 0)

        if furnishing_match:
            reasons.append(
                "Furnishing matches your preference."
            )
        else:
            disadvantages.append(
                "Furnishing differs from your preference."
            )

    if preferences.parking is not None:
        parking_match = (
            property_data.parking == preferences.parking
        )

        property_parts.append(100 if parking_match else 0)

        if parking_match:
            reasons.append(
                "Parking matches your preference."
            )
        else:
            disadvantages.append(
                "Parking does not match your preference."
            )

    scores["propertyPreference"] = (
        sum(property_parts) / len(property_parts)
        if property_parts
        else None
    )

    # -----------------------------------------------------
    # 4. AMENITIES
    # -----------------------------------------------------

    if preferences.amenities:

        available = {
            item.strip().casefold()
            for item in property_data.amenities
            if item.strip()
        }

        requested = {
            item.strip().casefold()
            for item in preferences.amenities
            if item.strip()
        }

        if requested:
            matched = requested.intersection(available)
            missing = requested - available

            scores["amenities"] = (
                len(matched) / len(requested)
            ) * 100

            if matched:
                reasons.append(
                    "Available amenities match: "
                    + ", ".join(sorted(matched))
                )

            if missing:
                disadvantages.append(
                    "Missing requested amenities: "
                    + ", ".join(sorted(missing))
                )

        else:
            scores["amenities"] = None

    else:
        scores["amenities"] = None

    # -----------------------------------------------------
    # 5. TRAVEL TIME
    # -----------------------------------------------------

    destination_requested = bool(
        preferences.workplace
        or preferences.college
        or preferences.preferredDestination
        or preferences.maxTravelTime is not None
    )

    if destination_requested:

        if (
            property_data.travelTimeMinutes is not None
            and preferences.maxTravelTime is not None
        ):

            if (
                property_data.travelTimeMinutes
                <= preferences.maxTravelTime
            ):
                scores["travelTime"] = 100

                reasons.append(
                    "Travel time is within your preferred limit."
                )

            else:
                scores["travelTime"] = 0

                disadvantages.append(
                    "Travel time exceeds your preferred limit."
                )

        else:
            # Missing travel data is unknown, not a mismatch.
            # It does not reduce the match score.
            scores["travelTime"] = None

            disadvantages.append(
                "Travel time could not be verified. "
                "Please check the route before making a decision."
            )

    else:
        scores["travelTime"] = None

    # -----------------------------------------------------
    # 6. OTHER PREFERENCES
    # -----------------------------------------------------

    if preferences.otherPreferences:

        description_match = contains_text(
            property_data.description,
            preferences.otherPreferences,
        )

        scores["otherPreferences"] = (
            100 if description_match else 0
        )

        if description_match:
            reasons.append(
                "Description contains your requested preference."
            )
        else:
            disadvantages.append(
                "Your additional preference could not be verified."
            )

    else:
        scores["otherPreferences"] = None

    # -----------------------------------------------------
    # FINAL WEIGHTED MATCH SCORE
    # -----------------------------------------------------

    total_weight = 0
    weighted_score = 0

    for category, weight in WEIGHTS.items():

        score = scores.get(category)

        # Categories without sufficient information are excluded.
        if score is not None:
            weighted_score += score * weight
            total_weight += weight

    match_percentage = (
        round(weighted_score / total_weight)
        if total_weight > 0
        else 0
    )

    if not reasons:
        reasons.append(
            "No strong matching preference was identified."
        )

    return {
        "propertyId": property_data.id,
        "matchPercentage": match_percentage,
        "reasons": reasons,
        "disadvantages": disadvantages,
    }


# =========================================================
# HOME AND HEALTH ENDPOINTS
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to HOMZY AI Service!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HOMZY AI",
        "model": "qwen2.5:1.5b",
        "recommendationEngine": "available",
        "recommendationWeights": WEIGHTS,
    }


# =========================================================
# EXISTING HOMZY CHATBOT
# =========================================================

@app.post("/chat")
async def chat(request: ChatRequest):

    instructions = """
    You are HOMZY AI, the friendly AI assistant of HOMZY,
    an AI-based home rental platform.

    Your responsibilities:
    1. Help tenants understand how to find rental homes.
    2. Explain rental budgets, BHK, amenities and locations.
    3. Help property owners understand property listings.
    4. Explain property recommendations and visit booking.
    5. Answer general home rental questions.
    6. Give simple, polite and beginner-friendly answers.

    Important rules:
    - Never invent property listings, prices or availability.
    - Never claim that a booking or payment is completed.
    - Do not claim to send emails or post listings automatically.
    - Explain only features that are actually available.
    - If you do not know something, say so honestly.
    - Keep answers clear, helpful and concise.
    """

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:

            response = await client.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": "qwen2.5:1.5b",
                    "messages": [
                        {
                            "role": "system",
                            "content": instructions,
                        },
                        {
                            "role": "user",
                            "content": request.message,
                        },
                    ],
                    "stream": False,
                },
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Ollama could not generate a response.",
            )

        data = response.json()
        reply = data.get("message", {}).get("content", "")

        if not reply:
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response.",
            )

        return {
            "reply": reply,
            "status": "success",
            "model": "qwen2.5:1.5b",
        }

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Please start Ollama.",
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="HOMZY AI took too long to respond.",
        )


# =========================================================
# MODULE 4: PROPERTY RECOMMENDATION ENDPOINT
# =========================================================

@app.post("/recommend")
def recommend(request: RecommendationRequest):

    results = []

    for property_data in request.candidates:

        match = calculate_match(
            request.preferences,
            property_data,
        )

        results.append(match)

    results.sort(
        key=lambda item: item["matchPercentage"],
        reverse=True,
    )

    return {
        "status": "success",
        "total": len(results),
        "recommendations": results,
    }
