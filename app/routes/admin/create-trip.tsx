import {Header} from "../../../components";
import {ComboBoxComponent} from "@syncfusion/ej2-react-dropdowns";
import type { Route } from './+types/create-trip'
import {comboBoxItems, selectItems} from "~/constants";
import {cn, formatKey} from "~/lib/utils";
import {LayerDirective, LayersDirective, MapsComponent} from "@syncfusion/ej2-react-maps";
import React, {useState} from "react";
import {world_map} from "~/constants/world_map";
import {ButtonComponent} from "@syncfusion/ej2-react-buttons";
import {account} from "~/appwrite/client";
import {useNavigate} from "react-router";

// List of reliable country API endpoints with fallbacks
const COUNTRY_API_ENDPOINTS = [
  'https://restcountries.com/v3.1/all?fields=flag,name,latlng,maps',
  'https://api.sampleapis.com/countries/countries'
];

export const loader = async () => {
  let lastError;

  // Try each API endpoint until one succeeds
  for (const endpoint of COUNTRY_API_ENDPOINTS) {
    try {
      console.log(`[Countries] Fetching from ${endpoint}`);
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      let data = await response.json();

      // Normalize different API response formats
      if (endpoint.includes('sampleapis.com')) {
        data = data.map((c: any) => ({
          flag: c.media.flag,
          name: { common: c.name },
          latlng: [c.latitude, c.longitude],
          maps: { openStreetMap: c.maps }
        }));
      }

      if (!Array.isArray(data)) {
        throw new Error('Expected array of countries');
      }

      const processedData = data.map((country: any) => ({
        name: `${country.flag || '🌐'} ${country.name.common}`,
        coordinates: country.latlng || [0, 0],
        value: country.name.common,
        openStreetMap: country.maps?.openStreetMap || ''
      }));

      console.log(`[Countries] Loaded ${processedData.length} countries`);
      return processedData;

    } catch (error) {
      console.error(`[Countries] Failed with ${endpoint}:`, error);
      lastError = error;
      continue;
    }
  }

  // Fallback data if all APIs fail
  console.error('[Countries] Using fallback data');
  return [
    {
      name: '🇺🇸 United States',
      coordinates: [37.0902, -95.7129],
      value: 'United States',
      openStreetMap: 'https://www.openstreetmap.org/relation/148838'
    },
    {
      name: '🇬🇧 United Kingdom',
      coordinates: [55.3781, -3.4360],
      value: 'United Kingdom',
      openStreetMap: 'https://www.openstreetmap.org/relation/62149'
    },
    {
      name: '🇨🇦 Canada',
      coordinates: [56.1304, -106.3468],
      value: 'Canada',
      openStreetMap: 'https://www.openstreetmap.org/relation/1428125'
    }
  ];
}

const CreateTrip = ({ loaderData }: Route.ComponentProps) => {
  const navigate = useNavigate();
  const countries = loaderData as Country[];

  const [formData, setFormData] = useState<TripFormData>({
    country: countries[0]?.name || "",
    travelStyle: "",
    interest: "",
    budget: "",
    duration: 0,
    groupType: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof TripFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate all fields
      if (!formData.country || !formData.travelStyle ||
          !formData.interest || !formData.budget || !formData.groupType) {
        throw new Error("Please fill all required fields");
      }

      if (formData.duration < 1 || formData.duration > 10) {
        throw new Error("Duration must be between 1-10 days");
      }

      // Verify authentication
      const user = await account.get();
      if (!user?.$id) {
        throw new Error("Please sign in to create trips");
      }

      console.log("[Submit] Creating trip with:", formData);
      const response = await fetch("/api/create-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          country: formData.country.replace(/^[^\w\s]+\s/, ''), // Remove flag emoji
          numberOfDays: formData.duration,
          travelStyle: formData.travelStyle,
          interests: formData.interest,
          budget: formData.budget,
          groupType: formData.groupType,
          userId: user.$id
        })
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create trip");
      }

      const result = await response.json();
      if (!result?.id) {
        throw new Error("Missing trip ID in response");
      }

      console.log("[Submit] Trip created:", result.id);
      navigate(`/trips/${result.id}`);

    } catch (error) {
      console.error("[Submit] Error:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const countryData = countries.map(country => ({
    text: country.name,
    value: country.value
  }));

  const mapData = [{
    country: formData.country,
    color: "#EA382E",
    coordinates: countries.find(c => c.name === formData.country)?.coordinates || []
  }];

  return (
    <main className="flex flex-col gap-10 pb-20 wrapper">
      <Header
        title="Add a New Trip"
        description="View and edit AI-generated travel plans"
      />

      <section className="mt-2.5 wrapper-md">
        <form className="trip-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="country">Country</label>
            <ComboBoxComponent
              id="country"
              dataSource={countryData}
              fields={{ text: "text", value: "value" }}
              placeholder="Select a Country"
              change={(e: { value: string | undefined }) => {
                if (e.value) handleChange("country", e.value);
              }}
              className="combo-box"
              allowFiltering={true}
              filtering={(e) => {
                const query = e.text.toLowerCase();
                e.updateData(
                  countries
                    .filter(country => country.name.toLowerCase().includes(query))
                    .map(country => ({
                      text: country.name,
                      value: country.value
                    }))
                );
              }}
            />
          </div>

          <div>
            <label htmlFor="duration">Duration (days)</label>
            <input
              id="duration"
              type="number"
              min="1"
              max="10"
              value={formData.duration}
              onChange={(e) => handleChange("duration", Number(e.target.value))}
              className="form-input placeholder:text-gray-100"
              placeholder="Enter 1-10 days"
            />
          </div>

          {selectItems.map((key) => (
            <div key={key}>
              <label htmlFor={key}>{formatKey(key)}</label>
              <ComboBoxComponent
                id={key}
                dataSource={comboBoxItems[key].map(item => ({
                  text: item,
                  value: item
                }))}
                fields={{ text: "text", value: "value" }}
                placeholder={`Select ${formatKey(key)}`}
                change={(e: { value: string | undefined }) => {
                  if (e.value) handleChange(key, e.value);
                }}
                allowFiltering={true}
                filtering={(e) => {
                  const query = e.text.toLowerCase();
                  e.updateData(
                    comboBoxItems[key]
                      .filter(item => item.toLowerCase().includes(query))
                      .map(item => ({ text: item, value: item }))
                  );
                }}
                className="combo-box"
              />
            </div>
          ))}

          <div>
            <label>Location on Map</label>
            <MapsComponent>
              <LayersDirective>
                <LayerDirective
                  shapeData={world_map}
                  dataSource={mapData}
                  shapePropertyPath="name"
                  shapeDataPath="country"
                  shapeSettings={{
                    colorValuePath: "color",
                    fill: "#E5E5E5"
                  }}
                />
              </LayersDirective>
            </MapsComponent>
          </div>

          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}

          <footer className="px-6 w-full">
            <ButtonComponent
              type="submit"
              className="button-class !h-12 !w-full"
              disabled={loading}
            >
              <img
                src={`/assets/icons/${loading ? "loader.svg" : "magic-star.svg"}`}
                className={cn("size-5", { "animate-spin": loading })}
                alt={loading ? "Loading" : "Generate"}
              />
              <span className="p-16-semibold text-white">
                {loading ? "Creating..." : "Generate Trip"}
              </span>
            </ButtonComponent>
          </footer>
        </form>
      </section>
    </main>
  );
};

export default CreateTrip;
