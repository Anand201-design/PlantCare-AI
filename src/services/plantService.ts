export interface DiagnosticResult {
  id: string;
  _id?: string;
  plant_name: string;
  scientific_name?: string;
  family?: string;
  disease_name: string;
  confidence_score: number;
  severity: "none" | "mild" | "moderate" | "severe" | string;
  overall_status: string;
  health_score: number;
  symptoms: string[];
  possible_nutrient_deficiency?: string;
  nutrient_deficiency_details?: string;
  treatment_recommendations: string[];
  prevention_recommendations: string[];
  image_path?: string;
  created_at?: string;
}

export interface PlantProfileItem {
  id: string;
  _id?: string;
  plantName: string;
  scientificName: string;
  category?: string;
  location?: string;
  growthStage?: string;
  imageUrl?: string;
  soilType?: string;
  sunlightRequirement?: string;
  waterRequirement?: string;
  temperatureRange?: string;
  humidityPreference?: string;
  latestHealthScore?: number;
  latestStatus?: string;
  latestDisease?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const plantService = {
  async getPlants(): Promise<PlantProfileItem[]> {
    const res = await fetch("/api/plants");
    if (!res.ok) throw new Error("Failed to fetch plants");
    return res.json();
  },

  async getPlantById(id: string): Promise<PlantProfileItem> {
    const res = await fetch(`/api/plants/${id}`);
    if (!res.ok) throw new Error("Failed to fetch plant profile");
    return res.json();
  },

  async createPlant(data: Partial<PlantProfileItem>): Promise<PlantProfileItem> {
    const res = await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create plant");
    return res.json();
  },

  async getAnalysisHistory(): Promise<DiagnosticResult[]> {
    const res = await fetch("/api/history");
    if (!res.ok) throw new Error("Failed to fetch analysis history");
    return res.json();
  },

  async getAnalysisById(id: string): Promise<DiagnosticResult> {
    const res = await fetch(`/api/results/${id}`);
    if (!res.ok) throw new Error("Failed to fetch analysis report");
    return res.json();
  },

  async analyzePlantImage(formData: FormData): Promise<DiagnosticResult> {
    const res = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Failed to analyze plant image");
    }
    return data;
  },

  async logSensorData(payload: {
    plantId: string;
    soilMoisture: number;
    soilPH: number;
    temperature: number;
    humidity: number;
  }): Promise<unknown> {
    const res = await fetch("/api/sensors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to log conditions");
    return res.json();
  },
};
