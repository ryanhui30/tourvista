import { type ActionFunctionArgs } from "react-router";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseMarkdownToJson } from "~/lib/utils";
import { appwriteConfig, database } from "~/appwrite/client";
import { ID } from "appwrite";

interface TripRequest {
  country: string;
  numberOfDays: number;
  travelStyle: string;
  interests: string;
  budget: string;
  groupType: string;
  userId: string;
}

interface TripResponse {
  id?: string;
  error?: string;
}

export const action = async ({ request }: ActionFunctionArgs): Promise<Response> => {

  try {
    // Validate request
    if (!request.body) {
      throw new Error("Empty request body");
    }

    const requestData: TripRequest = await request.json();

    // Validate all required fields
    const requiredFields: (keyof TripRequest)[] = [
      'country', 'numberOfDays', 'travelStyle',
      'interests', 'budget', 'groupType', 'userId'
    ];

    for (const field of requiredFields) {
      if (!requestData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Verify API keys
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    // Initialize AI model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.9,
        topP: 1
      }
    });

    // Generate detailed prompt
    const prompt = `
    Generate a detailed ${requestData.numberOfDays}-day travel itinerary for ${requestData.country}.
    Budget: ${requestData.budget}
    Travel Style: ${requestData.travelStyle}
    Interests: ${requestData.interests}
    Group Type: ${requestData.groupType}

    Return in this exact JSON format:
    {
    "name": "A descriptive title for the trip",
    "description": "A brief description of the trip and its highlights not exceeding 100 words",
    "estimatedPrice": "Lowest average price for the trip in USD, e.g.$price",
    "duration": ${requestData.numberOfDays},
    "budget": "${requestData.budget}",
    "travelStyle": "${requestData.travelStyle}",
    "interests": "${requestData.interests}",
    "groupType": "${requestData.groupType}",
    "bestTimeToVisit": [
          '🌸 Season (from month to month): reason to visit',
          '☀️ Season (from month to month): reason to visit',
          '🍁 Season (from month to month): reason to visit',
          '❄️ Season (from month to month): reason to visit'
        ],
      "weatherInfo": [
          '☀️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
          '🌦️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
          '🌧️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
          '❄️ Season: temperature range in Celsius (temperature range in Fahrenheit)'
        ],
       "location": {
          "city": "name of the city or region",
          "coordinates": [latitude, longitude],
          "openStreetMap": "link to open street map"
        },
       "itinerary": [
        {
          "day": 1,
          "location": "City/Region Name",
          "activities": [
            {"time": "Morning", "description": "🏰 Visit the local historic castle and enjoy a scenic walk"},
            {"time": "Afternoon", "description": "🖼️ Explore a famous art museum with a guided tour"},
            {"time": "Evening", "description": "🍷 Dine at a rooftop restaurant with local wine"}
          ]
        },
        ...
      ]
    }`;

    const aiResponse = await model.generateContent([prompt]);

    if (!aiResponse.response) {
      throw new Error("No response from Gemini AI");
    }

    const tripText = aiResponse.response.text();

    // Parse and validate trip data
    const tripData = parseMarkdownToJson(tripText);
    if (!tripData?.name || !tripData.itinerary) {
      throw new Error("Invalid trip data structure from AI");
    }

    // Fetch images (if API key available)
    let imageUrls: string[] = [];
    if (process.env.UNSPLASH_ACCESS_KEY) {
      try {
        const unsplashUrl = `https://api.unsplash.com/search/photos?` +
          `query=${encodeURIComponent(requestData.country)} ${encodeURIComponent(requestData.interests)}` +
          `&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;

        const unsplashResponse = await fetch(unsplashUrl);
        const unsplashData = await unsplashResponse.json();

        imageUrls = unsplashData.results
          .slice(0, 3)
          .map((img: any) => img.urls?.regular)
          .filter(Boolean);
      } catch (unsplashError) {
        console.error("[API] Unsplash error:", unsplashError);
      }
    }

    const document = await database.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.tripCollectionId,
      ID.unique(),
      {
        tripDetails: JSON.stringify(tripData),
        createdAt: new Date().toISOString(),
        imageUrls,
        userId: requestData.userId,
      }
    );

    return new Response(
      JSON.stringify({ id: document.$id } as TripResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("[API] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      } as TripResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
