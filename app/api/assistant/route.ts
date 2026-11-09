
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_SAVED_MESSAGES = 50;
const MAX_PROPERTY_CONTEXT = 10;

type HistoryItem = {
  role: "USER" | "ASSISTANT";
  content: string;
};

type AIHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type PropertyContext = {
  id: string;
  title: string;
  propertyType: string;
  city: string;
  locality: string;
  monthlyRent: number;
  securityDeposit: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  parking: boolean;
  amenities: string[];
  availableDate: string | null;
  description: string;
};

type PropertyDatabaseRow = {
  id: string;
  title: string;
  propertyType: string;
  city: string;
  locality: string;
  monthlyRent: number;
  securityDeposit: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  parking: boolean;
  amenities: Array<{
    amenity: {
      name: string;
    };
  }>;
  availableDate: Date | null;
  description: string;
};

const PROPERTY_QUESTION_PATTERN =
  /\b(property|properties|house|home|flat|apartment|room|rental|rent|listing|listings|bedroom|bedrooms|bathroom|bathrooms|amenit|parking|furnish|locality|location|address|deposit|available|availability|compare|comparison|near|student|commute|visit|booking|book|price|cost|budget|villa|pg|accommodation)\b/i;

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this",
  "what", "where", "when", "which", "would",
  "could", "should", "have", "has", "does",
  "from", "about", "your", "please", "tell",
  "show", "find", "help", "want", "need",
  "looking", "there", "their", "they", "them",
  "into", "near", "under", "over", "some",
  "any", "much", "many", "more", "less",
  "best", "good", "home", "house", "property",
  "properties", "rental", "rent", "flat",
  "apartment",
]);

async function getAuthorizedSession() {
  const session = await verifySession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Please log in to use HOMZY Assistant." },
        { status: 401 }
      ),
    };
  }

  const allowed =
    session.role === "TENANT" ||
    session.role === "OWNER" ||
    session.isOwner === true;

  if (!allowed) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "You are not authorized to use HOMZY Assistant." },
        { status: 403 }
      ),
    };
  }

  return {
    session,
    response: null,
  };
}

function needsPropertyContext(message: string): boolean {
  return PROPERTY_QUESTION_PATTERN.test(message);
}

function getSearchTerms(message: string): string[] {
  const words = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= 3 &&
        !STOP_WORDS.has(word) &&
        !/^\d+$/.test(word)
    );

  return [...new Set(words)].slice(0, 8);
}

async function getVerifiedPropertyContext(
  message: string
): Promise<PropertyContext[]> {
  const searchTerms = getSearchTerms(message);

  const where = {
    status: "APPROVED" as const,

    ...(searchTerms.length > 0
      ? {
          OR: searchTerms.flatMap((term) => [
            {
              title: {
                contains: term,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: term,
                mode: "insensitive" as const,
              },
            },
            {
              city: {
                contains: term,
                mode: "insensitive" as const,
              },
            },
            {
              locality: {
                contains: term,
                mode: "insensitive" as const,
              },
            },
          ]),
        }
      : {}),
  };

  const properties: PropertyDatabaseRow[] =
    await prisma.property.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      take: MAX_PROPERTY_CONTEXT,
      select: {
        id: true,
        title: true,
        propertyType: true,
        city: true,
        locality: true,
        monthlyRent: true,
        securityDeposit: true,
        area: true,
        bedrooms: true,
        bathrooms: true,
        furnishing: true,
        parking: true,
        availableDate: true,
        description: true,
        amenities: {
          select: {
            amenity: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

  const propertyContext: PropertyContext[] = properties.map(
    (property: PropertyDatabaseRow): PropertyContext => ({
      id: property.id,
      title: property.title,
      propertyType: property.propertyType,
      city: property.city,
      locality: property.locality,
      monthlyRent: property.monthlyRent,
      securityDeposit: property.securityDeposit,
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      furnishing: property.furnishing,
      parking: property.parking,

      amenities: property.amenities.map(
        (item: { amenity: { name: string } }): string =>
          item.amenity.name
      ),

      availableDate: property.availableDate
        ? property.availableDate.toISOString()
        : null,

      description: property.description.slice(0, 1000),
    })
  );

  return propertyContext;
}

// GET: Load conversations or messages from one conversation.
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await getAuthorizedSession();

    if (response || !session) {
      return response;
    }

    const conversationId =
      request.nextUrl.searchParams.get("conversationId");

    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.userId,
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: MAX_SAVED_MESSAGES,
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        conversation: {
          ...conversation,
          messages: conversation.messages.reverse(),
        },
      });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 30,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      conversations,
    });
  } catch (error) {
    console.error("HOMZY Assistant history error:", error);

    return NextResponse.json(
      { error: "Unable to load your chat history right now." },
      { status: 500 }
    );
  }
}

// POST: Save the user's message, retrieve verified properties,
// contact FastAPI and save the AI reply.
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await getAuthorizedSession();

    if (response || !session) {
      return response;
    }

    let body: {
      message?: unknown;
      conversationId?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request. Please try again." },
        { status: 400 }
      );
    }

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Your message is too long. Please keep it under 1000 characters.",
        },
        { status: 400 }
      );
    }

    if (
      body.conversationId !== undefined &&
      (
        typeof body.conversationId !== "string" ||
        !body.conversationId.trim()
      )
    ) {
      return NextResponse.json(
        { error: "Invalid conversation ID." },
        { status: 400 }
      );
    }

    // Apply per-user chatbot rate limiting.
    const rateLimit = checkRateLimit(session.userId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "You're sending messages too quickly. Please wait before trying again.",
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        }
      );
    }

    // Find an existing conversation owned by this user,
    // or create a new conversation.
    let conversationId: string;

    if (typeof body.conversationId === "string") {
      const existingConversation =
        await prisma.conversation.findFirst({
          where: {
            id: body.conversationId,
            userId: session.userId,
          },
          select: {
            id: true,
          },
        });

      if (!existingConversation) {
        return NextResponse.json(
          { error: "Conversation not found." },
          { status: 404 }
        );
      }

      conversationId = existingConversation.id;
    } else {
      const newConversation = await prisma.conversation.create({
        data: {
          userId: session.userId,
          title: message.slice(0, 80),
        },
        select: {
          id: true,
        },
      });

      conversationId = newConversation.id;
    }

    // Retrieve previous messages for this conversation.
    const previousMessages: HistoryItem[] =
      await prisma.chatMessage.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: MAX_HISTORY_MESSAGES,
        select: {
          role: true,
          content: true,
        },
      });

    const history: HistoryItem[] = previousMessages.reverse();

    // Remove unfinished messages left by an earlier failed AI request.
    while (
      history.length > 0 &&
      history[history.length - 1].role !== "ASSISTANT"
    ) {
      history.pop();
    }

    // Convert database roles to FastAPI format.
    const aiHistory: AIHistoryItem[] = history.map(
      (item: HistoryItem): AIHistoryItem => ({
        role: item.role === "USER" ? "user" : "assistant",
        content: item.content,
      })
    );

    // Save the user's message before contacting the AI.
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "USER",
        content: message,
      },
    });

    // Retrieve verified property information when needed.
    let propertyContext: PropertyContext[] = [];

    if (needsPropertyContext(message)) {
      try {
        propertyContext =
          await getVerifiedPropertyContext(message);
      } catch (error) {
        console.error(
          "HOMZY property context database error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "I could not retrieve verified property information right now. Please try again.",
            conversationId,
          },
          { status: 503 }
        );
      }
    }

    // Determine the role passed to FastAPI.
    const userRole =
      session.role === "OWNER" || session.isOwner
        ? "OWNER"
        : "TENANT";

    // Contact the HOMZY FastAPI AI service.
    let aiResponse: Response;

    try {
      aiResponse = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            history: aiHistory,
            propertyContext,
            userRole,
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(130000),
        }
      );
    } catch (error) {
      console.error(
        "HOMZY AI connection error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "HOMZY AI is temporarily unavailable. Your message has been saved. Please try again.",
          conversationId,
        },
        { status: 502 }
      );
    }

    // Handle FastAPI errors and validation failures.
    if (!aiResponse.ok) {
      const errorDetails = await aiResponse.text();

      console.error(
        "HOMZY AI service error:",
        aiResponse.status,
        errorDetails
      );

      return NextResponse.json(
        {
          error:
            "HOMZY AI could not respond right now. Your message has been saved. Please try again.",
          conversationId,
        },
        { status: 502 }
      );
    }

    // Validate the response returned by FastAPI.
    let aiData: {
      reply?: unknown;
    };

    try {
      aiData = await aiResponse.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "HOMZY AI returned an invalid response. Your message has been saved.",
          conversationId,
        },
        { status: 502 }
      );
    }

    const reply =
      typeof aiData.reply === "string"
        ? aiData.reply.trim()
        : "";

    if (!reply) {
      return NextResponse.json(
        {
          error:
            "HOMZY AI returned an empty response. Your message has been saved.",
          conversationId,
        },
        { status: 502 }
      );
    }

    // Save the assistant's reply in PostgreSQL.
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: reply,
      },
    });

    // Update the conversation's last activity time.
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        reply,
        conversationId,
        status: "success",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "HOMZY Assistant API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
