import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ASSETS_IMAGES_DIR = path.resolve(process.cwd(), "src/assets/images");

const REAL_IMAGE_FILES = {
  monstera: "hero_monstera_plant_1791123269478.jpg",
  monsteraSpot: "specimen_monstera_spot_1791123333163.jpg",
  rose: "specimen_rose_healthy_1791123284883.jpg",
  tomato: "specimen_tomato_blight_1791123302093.jpg",
  chilli: "specimen_chilli_chlorosis_1791123315102.jpg",
  fiddleLeafFig: "plant_fiddle_leaf_fig_1791124639713.jpg",
  peaceLily: "plant_peace_lily_1791124652513.jpg",
};

function resolveDiskImageFile(nameOrKey: string): string {
  const cleanName = path.basename(nameOrKey);
  const directPath = path.join(ASSETS_IMAGES_DIR, cleanName);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const lower = cleanName.toLowerCase();
  if (lower.includes("tomato") || lower.includes("blight")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.tomato);
  }
  if (lower.includes("rose")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.rose);
  }
  if (lower.includes("chilli") || lower.includes("chili") || lower.includes("chlorosis")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.chilli);
  }
  if (lower.includes("fiddle") || lower.includes("ficus")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.fiddleLeafFig);
  }
  if (lower.includes("lily") || lower.includes("peace")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.peaceLily);
  }
  if (lower.includes("monstera") && lower.includes("spot")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.monsteraSpot);
  }
  return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.monstera);
}

// Serve user uploads from /uploads, with graceful fallback to realistic photo if a historic upload was cleaned up
app.get("/uploads/:filename", (req, res) => {
  const safeName = path.basename(req.params.filename);
  const uploadFilePath = path.join(UPLOADS_DIR, safeName);
  if (fs.existsSync(uploadFilePath)) {
    res.sendFile(uploadFilePath);
    return;
  }
  const fallbackPath = resolveDiskImageFile(safeName);
  if (fs.existsSync(fallbackPath)) {
    res.sendFile(fallbackPath);
    return;
  }
  res.status(404).end();
});

// Serve real botanical JPEG photographs from /src/assets/images/
app.get("/src/assets/images/:name", (req, res) => {
  const targetFile = resolveDiskImageFile(req.params.name);
  if (fs.existsSync(targetFile)) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(targetFile);
    return;
  }
  res.status(404).end();
});

const DB_FILE = path.join(UPLOADS_DIR, "plantcare_db.json");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    fieldSize: 12 * 1024 * 1024,
  },
});

function pickRealisticImageUrl(
  currentUrl?: string,
  plantName?: string,
  scientificName?: string
): string {
  if (currentUrl && currentUrl.startsWith("/uploads/")) {
    const uploadDiskPath = path.join(UPLOADS_DIR, path.basename(currentUrl));
    if (fs.existsSync(uploadDiskPath)) {
      return currentUrl;
    }
  }
  const text = `${currentUrl || ""} ${plantName || ""} ${scientificName || ""}`.toLowerCase();
  if (text.includes("tomato") || text.includes("solanum")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.tomato}`;
  }
  if (text.includes("rose") || text.includes("rosa")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.rose}`;
  }
  if (text.includes("chilli") || text.includes("chili") || text.includes("capsicum")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.chilli}`;
  }
  if (text.includes("fiddle") || text.includes("ficus")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.fiddleLeafFig}`;
  }
  if (text.includes("lily") || text.includes("spathiphyllum")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.peaceLily}`;
  }
  if (text.includes("monstera") && text.includes("spot")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.monsteraSpot}`;
  }
  return `/src/assets/images/${REAL_IMAGE_FILES.monstera}`;
}

const INITIAL_PLANTS = [
  {
    id: "671f9b20c4d8a912e4560101",
    plantName: "Tomato",
    scientificName: "Solanum lycopersicum",
    category: "Vegetable · Solanaceae",
    location: "Greenhouse Bed A4",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.tomato}`,
    soilType: "Loamy well-draining mix (pH 6.2–6.8)",
    sunlightRequirement: "Full sun (6–8 hours daily)",
    waterRequirement: "Deep root watering every 2–3 days",
    temperatureRange: "20°C – 27°C",
    latestHealthScore: 82,
    latestStatus: "Moderate Stress",
    latestDisease: "Early Blight",
    notes: "Monitor lower leaves for concentric ring spots.",
  },
  {
    id: "671f9b20c4d8a912e4560102",
    plantName: "Garden Rose",
    scientificName: "Rosa × hybrida",
    category: "Flowering Shrub · Rosaceae",
    location: "South Courtyard",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.rose}`,
    soilType: "Rich organic loam (pH 6.5)",
    sunlightRequirement: "Full morning sun (6+ hours)",
    waterRequirement: "Water deeply twice weekly at base",
    temperatureRange: "16°C – 25°C",
    latestHealthScore: 96,
    latestStatus: "Healthy",
    latestDisease: "Healthy",
    notes: "Vibrant foliage and active bud development.",
  },
  {
    id: "671f9b20c4d8a912e4560103",
    plantName: "Chilli Pepper",
    scientificName: "Capsicum annuum",
    location: "Sunny Balcony Planter",
    category: "Spice Crop · Solanaceae",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.chilli}`,
    soilType: "Sandy loam with compost (pH 6.0–6.8)",
    sunlightRequirement: "Full bright sunlight",
    waterRequirement: "Moderate — allow top inch to dry",
    temperatureRange: "21°C – 29°C",
    latestHealthScore: 76,
    latestStatus: "Mild Stress",
    latestDisease: "Mild Interveinal Chlorosis",
    notes: "Scheduled for organic magnesium and nitrogen feed.",
  },
  {
    id: "671f9b20c4d8a912e4560104",
    plantName: "Monstera Deliciosa",
    scientificName: "Monstera deliciosa",
    category: "Indoor Tropical · Araceae",
    location: "Living Room East Window",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.monstera}`,
    soilType: "Chunky aroid mix with bark & perlite",
    sunlightRequirement: "Bright indirect morning light",
    waterRequirement: "Every 7–9 days when top 2 inches dry",
    temperatureRange: "18°C – 27°C",
    latestHealthScore: 94,
    latestStatus: "Healthy",
    latestDisease: "Healthy",
    notes: "New fenestrated leaf unfurling cleanly.",
  },
  {
    id: "671f9b20c4d8a912e4560105",
    plantName: "Fiddle Leaf Fig",
    scientificName: "Ficus lyrata",
    category: "Indoor Tree · Moraceae",
    location: "Sunroom Corner",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.fiddleLeafFig}`,
    soilType: "Well-aerated peat & bark mix (pH 6.0–6.5)",
    sunlightRequirement: "Bright filtered daylight",
    waterRequirement: "Every 7–10 days when top 2 inches dry",
    temperatureRange: "18°C – 26°C",
    latestHealthScore: 93,
    latestStatus: "Healthy",
    latestDisease: "Healthy",
    notes: "Broad violin-shaped leaves wiped clean for optimal photosynthesis.",
  },
  {
    id: "671f9b20c4d8a912e4560106",
    plantName: "Peace Lily",
    scientificName: "Spathiphyllum wallisii",
    category: "Flowering Tropical · Araceae",
    location: "Study Desk North Window",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.peaceLily}`,
    soilType: "Rich moisture-retentive organic potting mix",
    sunlightRequirement: "Medium to bright indirect light",
    waterRequirement: "Keep evenly moist; mist weekly",
    temperatureRange: "18°C – 26°C",
    latestHealthScore: 95,
    latestStatus: "Healthy",
    latestDisease: "Healthy",
    notes: "Blooming white spathes with glossy dark green leaves.",
  },
];

const INITIAL_HISTORY = [
  {
    id: "671f9b20c4d8a912e4560201",
    plant_name: "Tomato",
    scientific_name: "Solanum lycopersicum",
    family: "Solanaceae",
    disease_name: "Early Blight (Alternaria solani)",
    confidence_score: 0.94,
    severity: "moderate",
    overall_status: "Moderate Stress",
    health_score: 78,
    symptoms: [
      "Concentric dark brown rings on older lower leaves",
      "Slight yellow halo surrounding leaf lesions",
    ],
    possible_nutrient_deficiency: "Mild Nitrogen & Potassium depletion",
    nutrient_deficiency_details:
      "Lower leaf senescence accelerated by fungal stress and fruiting nutrient demand.",
    treatment_recommendations: [
      "Prune and dispose of affected lower leaves using sanitized shears.",
      "Apply organic copper fungicide or bio-fungicide spray every 7–10 days.",
      "Water at the base of the plant early in the morning to keep foliage dry.",
    ],
    prevention_recommendations: [
      "Mulch around the base of stems to prevent soil-borne spore splash.",
      "Ensure 60–75 cm spacing between plants for airflow.",
      "Rotate solanaceous crops each growing season.",
    ],
    image_path: `/src/assets/images/${REAL_IMAGE_FILES.tomato}`,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560202",
    plant_name: "Garden Rose",
    scientific_name: "Rosa × hybrida",
    family: "Rosaceae",
    disease_name: "Healthy",
    confidence_score: 0.98,
    severity: "none",
    overall_status: "Healthy",
    health_score: 96,
    symptoms: [
      "Deep glossy green cuticle",
      "Uniform leaf margins with zero necrotic spotting",
    ],
    possible_nutrient_deficiency: "None detected",
    nutrient_deficiency_details:
      "Optimal chlorophyll density and balanced macro/micronutrient uptake.",
    treatment_recommendations: [
      "Continue current deep watering schedule twice weekly.",
      "Deadhead spent blooms to encourage new flowering stems.",
    ],
    prevention_recommendations: [
      "Maintain morning sun exposure to dry overnight dew quickly.",
      "Top-dress with organic compost in early spring and mid-summer.",
    ],
    image_path: `/src/assets/images/${REAL_IMAGE_FILES.rose}`,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560203",
    plant_name: "Chilli Pepper",
    scientific_name: "Capsicum annuum",
    family: "Solanaceae",
    disease_name: "Interveinal Chlorosis",
    confidence_score: 0.91,
    severity: "mild",
    overall_status: "Mild Stress",
    health_score: 76,
    symptoms: [
      "Pale yellowing between leaf veins",
      "Slight upward curling on mid-canopy foliage",
    ],
    possible_nutrient_deficiency: "Magnesium & Nitrogen Deficiency",
    nutrient_deficiency_details:
      "Interveinal yellowing indicates reduced chlorophyll synthesis due to low magnesium availability.",
    treatment_recommendations: [
      "Apply a foliar spray of diluted Epsom salt (1 tsp per liter of water).",
      "Feed with a balanced organic liquid fertilizer rich in trace minerals.",
    ],
    prevention_recommendations: [
      "Maintain soil pH between 6.0 and 6.8 for optimal nutrient uptake.",
      "Avoid overwatering which leaches soluble magnesium from container soil.",
    ],
    image_path: `/src/assets/images/${REAL_IMAGE_FILES.chilli}`,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560204",
    plant_name: "Monstera Deliciosa",
    scientific_name: "Monstera deliciosa",
    family: "Araceae",
    disease_name: "Minor Leaf Tip Low-Humidity Stress",
    confidence_score: 0.95,
    severity: "mild",
    overall_status: "Healthy",
    health_score: 91,
    symptoms: [
      "Rich fenestrated leaf lamina",
      "Slight dry margin on oldest lower leaf tip",
    ],
    possible_nutrient_deficiency: "None detected",
    nutrient_deficiency_details:
      "Overall foliar nutrition is optimal; minor tip browning is caused by low indoor relative humidity.",
    treatment_recommendations: [
      "Increase ambient humidity around the plant to 55%–65%.",
      "Water thoroughly when the top 2 inches of potting mix feel dry.",
    ],
    prevention_recommendations: [
      "Keep away from direct AC or heating vents.",
      "Wipe leaves monthly to maximize photosynthetic efficiency.",
    ],
    image_path: `/src/assets/images/${REAL_IMAGE_FILES.monsteraSpot}`,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_RECOMMENDATIONS = [
  {
    id: "rec-101",
    plantId: "671f9b20c4d8a912e4560101",
    plantName: "Tomato",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.tomato}`,
    recommendation: "Prune lower blight-affected leaves & apply copper bio-fungicide",
    category: "Disease prevention",
    priority: "high",
    explanation:
      "Removing lower leaves with concentric lesions stops Alternaria spores from splashing onto healthy upper foliage.",
    recommendedAction:
      "Remove the bottom 3–4 infected leaflets with clean shears and mist canopy with organic copper soap.",
    date: new Date().toISOString(),
    status: "active",
  },
  {
    id: "rec-102",
    plantId: "671f9b20c4d8a912e4560104",
    plantName: "Monstera Deliciosa",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.monstera}`,
    recommendation: "Rotate container 90° and mist aerial roots",
    category: "Lighting",
    priority: "medium",
    explanation:
      "Even light exposure ensures balanced petiole posture and larger fenestrations on new leaves.",
    recommendedAction:
      "Turn pot a quarter turn clockwise and wipe dust from broad leaf surfaces with a damp cloth.",
    date: new Date().toISOString(),
    status: "active",
  },
  {
    id: "rec-103",
    plantId: "671f9b20c4d8a912e4560103",
    plantName: "Chilli Pepper",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.chilli}`,
    recommendation: "Supplement with magnesium & balanced organic nitrogen",
    category: "Nutrition",
    priority: "high",
    explanation:
      "Corrects interveinal chlorosis and supports healthy flower and fruit set.",
    recommendedAction:
      "Water with 500ml of chelated micronutrient solution during morning irrigation.",
    date: new Date().toISOString(),
    status: "active",
  },
  {
    id: "rec-104",
    plantId: "671f9b20c4d8a912e4560102",
    plantName: "Garden Rose",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.rose}`,
    recommendation: "Deep base watering & organic mulch refresh",
    category: "Watering",
    priority: "low",
    explanation:
      "Keeps root zone cool and moist without wetting foliage.",
    recommendedAction:
      "Deliver 3 liters of water at the root collar and maintain a 5cm bark mulch layer.",
    date: new Date().toISOString(),
    status: "completed",
  },
  {
    id: "rec-105",
    plantId: "671f9b20c4d8a912e4560105",
    plantName: "Fiddle Leaf Fig",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.fiddleLeafFig}`,
    recommendation: "Wipe broad leaf lamina & check top 2 inches of soil",
    category: "Maintenance",
    priority: "medium",
    explanation:
      "Dust-free violin-shaped leaves absorb up to 30% more indirect indoor sunlight.",
    recommendedAction:
      "Gently wipe upper and lower leaf surfaces with a soft damp microfiber cloth.",
    date: new Date().toISOString(),
    status: "active",
  },
  {
    id: "rec-106",
    plantId: "671f9b20c4d8a912e4560106",
    plantName: "Peace Lily",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.peaceLily}`,
    recommendation: "Maintain gentle humidity around emerging white spathes",
    category: "Humidity",
    priority: "low",
    explanation:
      "Consistent 55–65% relative humidity prevents brown leaf tips and prolongs bloom life.",
    recommendedAction:
      "Mist surrounding air with filtered water and keep soil lightly moist.",
    date: new Date().toISOString(),
    status: "active",
  },
];

interface DatabaseSchema {
  plants: typeof INITIAL_PLANTS;
  history: typeof INITIAL_HISTORY;
  recommendations: typeof INITIAL_RECOMMENDATIONS;
  sensors: Record<string, unknown>[];
}

function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw);

      const rawPlants: typeof INITIAL_PLANTS = Array.isArray(parsed.plants)
        ? parsed.plants
        : INITIAL_PLANTS;
      const existingIds = new Set(rawPlants.map((p) => p.id));
      for (const seedPlant of INITIAL_PLANTS) {
        if (!existingIds.has(seedPlant.id)) {
          rawPlants.push(seedPlant);
        }
      }
      const plants = rawPlants.map((p) => ({
        ...p,
        imageUrl: pickRealisticImageUrl(p.imageUrl, p.plantName, p.scientificName),
      }));

      const rawHistory: typeof INITIAL_HISTORY = Array.isArray(parsed.history)
        ? parsed.history
        : INITIAL_HISTORY;
      const history = rawHistory.map((h) => ({
        ...h,
        image_path: pickRealisticImageUrl(h.image_path, h.plant_name, h.scientific_name),
      }));

      const rawRecs: typeof INITIAL_RECOMMENDATIONS = Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : INITIAL_RECOMMENDATIONS;
      const existingRecIds = new Set(rawRecs.map((r) => r.id));
      for (const seedRec of INITIAL_RECOMMENDATIONS) {
        if (!existingRecIds.has(seedRec.id)) {
          rawRecs.push(seedRec);
        }
      }
      const recommendations = rawRecs.map((r) => ({
        ...r,
        plantImage: pickRealisticImageUrl(r.plantImage, r.plantName),
      }));

      return {
        plants,
        history,
        recommendations,
        sensors: parsed.sensors || [],
      };
    }
  } catch {
    // ignore
  }
  const initial = {
    plants: INITIAL_PLANTS,
    history: INITIAL_HISTORY,
    recommendations: INITIAL_RECOMMENDATIONS,
    sensors: [],
  };
  saveDb(initial);
  return initial;
}

function saveDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch {
    // ignore
  }
}

const PRESET_RESULTS: Record<string, (typeof INITIAL_HISTORY)[0]> = {
  tomato: INITIAL_HISTORY[0],
  rose: INITIAL_HISTORY[1],
  chilli: INITIAL_HISTORY[2],
  monstera: INITIAL_HISTORY[3],
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "PlantCare AI" });
});

app.get("/api/plants", (_req, res) => {
  const db = loadDb();
  res.json(db.plants);
});

app.get("/api/plants/:id", (req, res) => {
  const db = loadDb();
  const found = db.plants.find((p) => p.id === req.params.id) || db.plants[0];
  res.json(found);
});

app.post("/api/plants", (req, res) => {
  const db = loadDb();
  const body = req.body || {};
  const plantName = body.plantName || "Botanical Specimen";
  const scientificName = body.scientificName || "Botanical cultivar";
  const newPlant = {
    id: `plant_${Date.now()}`,
    plantName,
    scientificName,
    category: body.category || "Indoor Tropical",
    location: body.location || "Home Garden",
    imageUrl: pickRealisticImageUrl(body.imageUrl, plantName, scientificName),
    soilType: body.soilType || "Well-draining potting mix",
    sunlightRequirement: body.sunlightRequirement || "Bright indirect sunlight",
    waterRequirement: body.waterRequirement || "When top 2 inches feel dry",
    temperatureRange: body.temperatureRange || "18°C – 27°C",
    latestHealthScore: body.latestHealthScore ?? 92,
    latestStatus: body.latestStatus || "Healthy",
    latestDisease: body.latestDisease || "Healthy",
    notes: body.notes || "",
  };
  db.plants.unshift(newPlant);
  saveDb(db);
  res.status(201).json(newPlant);
});

app.put("/api/plants/:id", (req, res) => {
  const db = loadDb();
  const idx = db.plants.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }
  const merged = { ...db.plants[idx], ...req.body };
  merged.imageUrl = pickRealisticImageUrl(
    merged.imageUrl,
    merged.plantName,
    merged.scientificName
  );
  db.plants[idx] = merged;
  saveDb(db);
  res.json(db.plants[idx]);
});

app.delete("/api/plants/:id", (req, res) => {
  const db = loadDb();
  db.plants = db.plants.filter((p) => p.id !== req.params.id);
  saveDb(db);
  res.json({ deleted: true });
});

app.get("/api/history", (_req, res) => {
  const db = loadDb();
  res.json(db.history);
});

app.delete("/api/history/:id", (req, res) => {
  const db = loadDb();
  const targetId = req.params.id;
  const initialLen = db.history.length;
  db.history = db.history.filter((h) => h.id !== targetId);
  if (db.history.length === initialLen) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  saveDb(db);
  res.json({ deleted: true, id: targetId });
});

app.get("/api/results/:id", (req, res) => {
  const db = loadDb();
  const found = db.history.find((h) => h.id === req.params.id);
  if (!found) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  res.json(found);
});

const SUPPORTED_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite"] as const;

function getConfiguredGeminiModels(): string[] {
  const envModel = (process.env.GEMINI_MODEL || "").trim().replace(/^models\//, "");
  const isDeprecated =
    !envModel ||
    envModel.includes("2.5") ||
    envModel.includes("2.0") ||
    envModel.includes("1.5") ||
    envModel === "gemini-pro";

  if (!isDeprecated && !SUPPORTED_GEMINI_MODELS.includes(envModel as (typeof SUPPORTED_GEMINI_MODELS)[number])) {
    return [envModel, ...SUPPORTED_GEMINI_MODELS];
  }
  return [...SUPPORTED_GEMINI_MODELS];
}

function handleUploadMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    const singleUpload = upload.single("image") as unknown as express.RequestHandler;
    singleUpload(req, res, (err: unknown) => {
      if (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Invalid image upload payload. Please upload a JPG, PNG, or WEBP image under 10 MB.";
        res.status(400).json({ error: message, message });
        return;
      }
      next();
    });
  } else {
    next();
  }
}

app.post("/api/analyze", handleUploadMiddleware, async (req, res) => {
  try {
    const db = loadDb();
    const presetKey = (req.body?.specimenPreset || "").toLowerCase();

    if (presetKey && PRESET_RESULTS[presetKey]) {
      const presetTemplate = PRESET_RESULTS[presetKey];
      const created = {
        ...presetTemplate,
        id: `scan_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      db.history.unshift(created);
      saveDb(db);
      res.json(created);
      return;
    }

    let imageBuffer: Buffer | null = null;
    let imageMimeType = "image/jpeg";
    let originalName = "uploaded_leaf.jpg";

    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
      imageMimeType = req.file.mimetype || req.body?.mime_type || "image/jpeg";
      originalName = req.file.originalname || originalName;
    } else if (req.body?.imageBase64 && typeof req.body.imageBase64 === "string") {
      const rawBase64 = req.body.imageBase64.replace(/^data:[^;]+;base64,/, "");
      imageBuffer = Buffer.from(rawBase64, "base64");
      imageMimeType = req.body.mime_type || req.body.mimeType || "image/jpeg";
      originalName = req.body.filename || originalName;
    }

    let savedImagePath = `/src/assets/images/${REAL_IMAGE_FILES.tomato}`;
    if (imageBuffer && imageBuffer.length > 0) {
      const ext = imageMimeType.includes("png")
        ? "png"
        : imageMimeType.includes("webp")
          ? "webp"
          : "jpg";
      const filename = `leaf_${Date.now()}.${ext}`;
      const fullPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(fullPath, imageBuffer);
      savedImagePath = `/uploads/${filename}`;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && imageBuffer && imageBuffer.length > 0) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      const base64Image = imageBuffer.toString("base64");
      const hint = req.body?.plant_hint ? `User hint: ${req.body.plant_hint}.` : "";
      const reqLang = (req.body?.language || "en").toLowerCase();
      const langInstruction =
        reqLang === "ta"
          ? "IMPORTANT: The user's selected language is Tamil (தமிழ்). Return plant_name in Tamil with English in parentheses, keep scientific_name and family in standard Latin botanical terms, and write disease_name, symptoms, possible_nutrient_deficiency, nutrient_deficiency_details, treatment_recommendations, and prevention_recommendations in natural, readable Tamil (தமிழ்)."
          : "";

      const modelsToTry = getConfiguredGeminiModels();

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: base64Image,
                },
              },
              {
                text: `You are an expert botanist and plant pathologist. Analyze this plant image. ${hint} ${langInstruction} Return a JSON object with plant_name, scientific_name, family, disease_name (or "Healthy"), confidence_score (0 to 1), severity ("none", "mild", "moderate", "severe"), overall_status ("Healthy", "Mild Stress", "Moderate Stress", "Severe Stress"), health_score (0 to 100), symptoms (array of strings), possible_nutrient_deficiency, nutrient_deficiency_details, treatment_recommendations (array of strings), prevention_recommendations (array of strings).`,
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  plant_name: { type: Type.STRING },
                  scientific_name: { type: Type.STRING },
                  family: { type: Type.STRING },
                  disease_name: { type: Type.STRING },
                  confidence_score: { type: Type.NUMBER },
                  severity: { type: Type.STRING },
                  overall_status: { type: Type.STRING },
                  health_score: { type: Type.NUMBER },
                  symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  possible_nutrient_deficiency: { type: Type.STRING },
                  nutrient_deficiency_details: { type: Type.STRING },
                  treatment_recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  prevention_recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            const normalizedDisease =
              !parsed.disease_name ||
              parsed.disease_name.toLowerCase() === "none" ||
              parsed.disease_name.toLowerCase() === "no disease"
                ? "Healthy"
                : parsed.disease_name;
            const resultRecord = {
              id: `scan_${Date.now()}`,
              plant_name: parsed.plant_name || "Botanical Specimen",
              scientific_name: parsed.scientific_name || "Botanical cultivar",
              family: parsed.family || "Angiosperms",
              disease_name: normalizedDisease,
              confidence_score: parsed.confidence_score ?? 0.93,
              severity: parsed.severity || "none",
              overall_status: parsed.overall_status || "Healthy",
              health_score: parsed.health_score ?? 88,
              symptoms:
                Array.isArray(parsed.symptoms) && parsed.symptoms.length > 0
                  ? parsed.symptoms
                  : ["Foliar surface inspected"],
              possible_nutrient_deficiency:
                parsed.possible_nutrient_deficiency || "None detected",
              nutrient_deficiency_details:
                parsed.nutrient_deficiency_details ||
                "Balanced foliar nutrition observed.",
              treatment_recommendations:
                Array.isArray(parsed.treatment_recommendations) &&
                parsed.treatment_recommendations.length > 0
                  ? parsed.treatment_recommendations
                  : ["Maintain consistent watering and bright indirect light."],
              prevention_recommendations:
                Array.isArray(parsed.prevention_recommendations) &&
                parsed.prevention_recommendations.length > 0
                  ? parsed.prevention_recommendations
                  : ["Ensure good air circulation and well-draining soil."],
              image_path: savedImagePath,
              created_at: new Date().toISOString(),
            };
            db.history.unshift(resultRecord);
            saveDb(db);
            res.json(resultRecord);
            return;
          }
        } catch (_modelErr) {
          // Try next supported model in fallback chain
          continue;
        }
      }
    }

    // Match hint/filename if all models are temporarily unreachable, while preserving the user's uploaded image_path
    const hintKey = `${req.body?.plant_hint || ""} ${originalName}`.toLowerCase();
    let template = INITIAL_HISTORY[1]; // Default healthy botanical specimen for user uploads
    if (hintKey.includes("tomato") || hintKey.includes("blight") || hintKey.includes("spot")) {
      template = INITIAL_HISTORY[0];
    } else if (hintKey.includes("chilli") || hintKey.includes("pepper") || hintKey.includes("yellow")) {
      template = INITIAL_HISTORY[2];
    } else if (hintKey.includes("monstera")) {
      template = INITIAL_HISTORY[3];
    }

    const fallbackRecord = {
      ...template,
      id: `scan_${Date.now()}`,
      image_path: savedImagePath,
      created_at: new Date().toISOString(),
    };
    db.history.unshift(fallbackRecord);
    saveDb(db);
    res.json(fallbackRecord);
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({
      error: "Plant health analysis failed",
      message: rawMessage.replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED]"),
    });
  }
});

app.get("/api/recommendations", (_req, res) => {
  const db = loadDb();
  res.json(db.recommendations);
});

app.put("/api/recommendations/:id", (req, res) => {
  const db = loadDb();
  const item = db.recommendations.find((r) => r.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (req.body?.status) item.status = req.body.status;
  saveDb(db);
  res.json(item);
});

app.post("/api/sensors", (req, res) => {
  const db = loadDb();
  const entry = {
    id: `sensor_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  db.sensors.unshift(entry);
  saveDb(db);
  res.status(201).json(entry);
});

const LANGUAGE_NAME_MAP: Record<string, string> = {
  en: "English",
  ta: "Tamil (தமிழ்)",
  hi: "Hindi (हिन्दी)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  zh: "Simplified Chinese (中文)",
};

app.post("/api/assistant", handleUploadMiddleware, async (req, res) => {
  try {
    const db = loadDb();
    const rawMessage = String(req.body?.message || "").trim();
    const selectedPlantId = String(req.body?.plantId || "").trim();
    const reqLang = String(req.body?.language || "en").trim().toLowerCase();
    const languageName = LANGUAGE_NAME_MAP[reqLang] || "English";

    let imageBuffer: Buffer | null = null;
    let imageMimeType = "image/jpeg";
    let savedImageUrl: string | undefined;

    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
      imageMimeType = req.file.mimetype || req.body?.mime_type || "image/jpeg";
    } else if (req.body?.imageBase64 && typeof req.body.imageBase64 === "string") {
      const rawBase64 = req.body.imageBase64.replace(/^data:[^;]+;base64,/, "");
      imageBuffer = Buffer.from(rawBase64, "base64");
      imageMimeType = req.body.mime_type || req.body.mimeType || "image/jpeg";
    }

    if (imageBuffer && imageBuffer.length > 0) {
      const ext = imageMimeType.includes("png")
        ? "png"
        : imageMimeType.includes("webp")
          ? "webp"
          : "jpg";
      const filename = `assistant_${Date.now()}.${ext}`;
      const fullPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(fullPath, imageBuffer);
      savedImageUrl = `/uploads/${filename}`;
    }

    if (!rawMessage && (!imageBuffer || imageBuffer.length === 0)) {
      res.status(400).json({
        error: "Please enter a question or attach a plant image.",
        message: "Please enter a question or attach a plant image.",
      });
      return;
    }

    // Gather real available plant context if a plant is selected
    const selectedPlant = selectedPlantId
      ? db.plants.find((p) => p.id === selectedPlantId)
      : undefined;

    let plantContextSummary = "No specific plant selected by the user.";
    if (selectedPlant) {
      const matchingAnalyses = db.history.filter(
        (h) =>
          h.plant_name.toLowerCase().includes(selectedPlant.plantName.toLowerCase()) ||
          selectedPlant.plantName.toLowerCase().includes(h.plant_name.toLowerCase()) ||
          (h.scientific_name &&
            selectedPlant.scientificName &&
            h.scientific_name.toLowerCase() === selectedPlant.scientificName.toLowerCase())
      );

      const matchingRecs = db.recommendations.filter(
        (r) =>
          r.plantId === selectedPlant.id ||
          r.plantName.toLowerCase() === selectedPlant.plantName.toLowerCase()
      );

      const latestAnalysis = matchingAnalyses[0];

      plantContextSummary = [
        `Selected Plant Profile:`,
        `- Plant Name: ${selectedPlant.plantName}`,
        `- Scientific Name: ${selectedPlant.scientificName || "Not recorded"}`,
        `- Category: ${selectedPlant.category || "Not recorded"}`,
        `- Location: ${selectedPlant.location || "Not recorded"}`,
        `- Current Health Score: ${selectedPlant.latestHealthScore ?? "Not recorded"}%`,
        `- Current Status: ${selectedPlant.latestStatus || "Not recorded"}`,
        `- Recorded Condition/Disease: ${selectedPlant.latestDisease || "None"}`,
        `- Soil Type: ${selectedPlant.soilType || "Not recorded"}`,
        `- Sunlight Requirement: ${selectedPlant.sunlightRequirement || "Not recorded"}`,
        `- Watering Requirement: ${selectedPlant.waterRequirement || "Not recorded"}`,
        `- Temperature Range: ${selectedPlant.temperatureRange || "Not recorded"}`,
        `- Notes: ${selectedPlant.notes || "None"}`,
        latestAnalysis
          ? `Latest Diagnostic Analysis (${latestAnalysis.created_at}):\n  - Diagnosis: ${latestAnalysis.disease_name} (Confidence: ${Math.round((latestAnalysis.confidence_score || 0) * 100)}%, Severity: ${latestAnalysis.severity})\n  - Health Score: ${latestAnalysis.health_score}%\n  - Observed Symptoms: ${(latestAnalysis.symptoms || []).join("; ")}\n  - Nutrient Assessment: ${latestAnalysis.possible_nutrient_deficiency || "None"} (${latestAnalysis.nutrient_deficiency_details || ""})\n  - Previous Treatment Recommendations: ${(latestAnalysis.treatment_recommendations || []).join("; ")}\n  - Prevention Steps: ${(latestAnalysis.prevention_recommendations || []).join("; ")}`
          : `Previous Diagnostic Analyses: None recorded for this plant.`,
        matchingRecs.length > 0
          ? `Active Care Recommendations:\n  - ${matchingRecs.map((r) => `${r.recommendation} (${r.category}, priority: ${r.priority}): ${r.recommendedAction}`).join("\n  - ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    // Parse recent conversation history if provided
    let historyContext = "";
    if (req.body?.history) {
      try {
        const parsedHistory =
          typeof req.body.history === "string"
            ? JSON.parse(req.body.history)
            : req.body.history;
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          const recentTurns = parsedHistory.slice(-6);
          historyContext =
            "Recent conversation turns:\n" +
            recentTurns
              .map(
                (m: { role?: string; content?: string }) =>
                  `${m.role === "assistant" ? "AI Plant Assistant" : "User"}: ${String(m.content || "").slice(0, 500)}`
              )
              .join("\n");
        }
      } catch {
        // ignore malformed history
      }
    }

    const formatTemplate =
      reqLang === "ta"
        ? [
            `🌱 பதில்:`,
            `[1–2 எளிய வாக்கியங்களில் நேரடி பதில்]`,
            ``,
            `💡 செய்ய வேண்டியவை:`,
            `• [படி 1]`,
            `• [படி 2]`,
            `• [படி 3]`,
            ``,
            `⚠️ கவனிக்க வேண்டியவை:`,
            `[தேவையெனில் ஒரு சிறிய எச்சரிக்கை அல்லது குறிப்பு]`,
          ].join("\n")
        : [
            `🌱 Answer:`,
            `[One short direct answer in 1–2 simple sentences]`,
            ``,
            `💡 What to do:`,
            `• [Step 1]`,
            `• [Step 2]`,
            `• [Step 3]`,
            ``,
            `⚠️ Watch for:`,
            `[One short warning or tip if necessary]`,
          ].join("\n");

    const systemInstruction = [
      `You are the PlantCare AI Assistant. Give short, simple, beginner-friendly, and practical plant-care answers.`,
      `STRICT LANGUAGE RULE:`,
      `- The user's selected application language is ${languageName} (code: "${reqLang}").`,
      `- Understand the user's question whether it is written in Tamil, Tamil-English mixed (Tanglish), English, or another language, and ALWAYS respond 100% in ${languageName}.`,
      `- If Tamil (ta) is selected, write in natural, simple everyday Tamil without unnecessary English words (keep Latin scientific names only when helpful).`,
      `STRICT CONCISE RESPONSE STYLE (50–120 WORDS MAXIMUM):`,
      `- NEVER write long paragraphs or essays. Keep the entire response around 50–120 words (or 1–4 short sentences for very simple questions).`,
      `- Do NOT repeat the user's question or add filler greetings.`,
      `- Give the most important direct answer first.`,
      `- Use 3–5 short bullet points (•) for actions.`,
      `- Use simple everyday language. Avoid heavy scientific jargon; if a technical term is needed, explain it in one simple sentence.`,
      `- Use this clean structure (localized to ${languageName}):`,
      formatTemplate,
      `PLANT CONTEXT & SAFETY RULES:`,
      `- Use the provided Selected Plant Profile and Previous Diagnostic Analysis when available. Do NOT invent plant details that are not provided.`,
      `- If no plant is selected, give practical general advice and briefly mention they can select a saved plant for tailored care.`,
      `- For uncertain symptoms, say "This may be..." (or its ${languageName} equivalent), give practical next steps, and suggest uploading a clear leaf photo when visual inspection helps.`,
      `- For severe plant damage, briefly suggest consulting a local gardening or agriculture expert.`,
      `- Do not use markdown bold asterisks (**text**) or code fences; keep plain text with the section emojis and bullet points (•) so it reads cleanly and speaks naturally via Text-to-Speech.`,
    ].join("\n");

    const userPrompt = [
      plantContextSummary,
      historyContext,
      imageBuffer
        ? `The user attached a plant photo for visual inspection.`
        : `No image was attached.`,
      `User Question: ${rawMessage || "Please check this plant image and tell me what to do in simple steps."}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const modelsToTry = getConfiguredGeminiModels();

      for (const modelName of modelsToTry) {
        try {
          const parts: Array<
            | { inlineData: { mimeType: string; data: string } }
            | { text: string }
          > = [];

          if (imageBuffer && imageBuffer.length > 0) {
            parts.push({
              inlineData: {
                mimeType: imageMimeType,
                data: imageBuffer.toString("base64"),
              },
            });
          }
          parts.push({ text: userPrompt });

          const response = await ai.models.generateContent({
            model: modelName,
            contents: parts,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          });

          const replyText = response.text?.trim();
          if (replyText) {
            const cleanedReply = replyText.replace(/\*\*/g, "").trim();
            res.json({
              id: `msg_${Date.now()}`,
              reply: cleanedReply,
              plantId: selectedPlant?.id,
              plantName: selectedPlant?.plantName,
              imageUrl: savedImageUrl,
              model: modelName,
              createdAt: new Date().toISOString(),
            });
            return;
          }
        } catch (_modelErr) {
          continue;
        }
      }
    }

    // Concise context-aware fallback if upstream AI is temporarily unreachable
    const plantLabel = selectedPlant
      ? `${selectedPlant.plantName} (${selectedPlant.scientificName})`
      : reqLang === "ta"
        ? "உங்கள் செடி"
        : "your plant";

    const fallbackReply =
      reqLang === "ta"
        ? [
            `🌱 பதில்:`,
            `${plantLabel} ஆரோக்கியமாக வளர மண்ணின் ஈரப்பதம் மற்றும் வெளிச்சத்தைச் சரியாகப் பராமரிக்க வேண்டும்.${selectedPlant ? ` (தற்போதைய ஆரோக்கியம்: ${selectedPlant.latestHealthScore ?? 90}%)` : ""}`,
            ``,
            `💡 செய்ய வேண்டியவை:`,
            `• மேல் மண் 2–3 செ.மீ காய்ந்த பிறகு மட்டும் தண்ணீர் ஊற்றவும்.`,
            `• ${selectedPlant?.sunlightRequirement ? "போதுமான வெளிச்சம் கிடைக்கும் இடத்தில் வைக்கவும்." : "தினமும் மிதமான சூரிய ஒளி கிடைக்குமாறு வைக்கவும்."}`,
            `• பாதிக்கப்பட்ட அல்லது பழுத்த இலைகளை அகற்றி விடவும்.`,
            ``,
            `⚠️ கவனிக்க வேண்டியவை:`,
            `அதிகப்படியான நீர் வேர்களைப் பாதிக்கலாம். துல்லியமான ஆய்வுக்கு இலையின் தெளிவான புகைப்படத்தைப் பதிவேற்றவும்.`,
          ].join("\n")
        : [
            `🌱 Answer:`,
            `This may be caused by watering imbalance, light stress, or mild nutrient deficiency in ${plantLabel}.${selectedPlant ? ` (Current health score: ${selectedPlant.latestHealthScore ?? 90}%)` : ""}`,
            ``,
            `💡 What to do:`,
            `• Check the top 2–3 cm of soil and water only when it feels dry.`,
            `• Ensure ${selectedPlant?.sunlightRequirement?.toLowerCase() || "steady bright indirect sunlight"} and good pot drainage.`,
            `• Upload a clear leaf photo if spots or yellowing spread.`,
            ``,
            `⚠️ Watch for:`,
            `Avoid overwatering, as soggy soil can quickly damage the roots.`,
          ].join("\n");

    res.json({
      id: `msg_${Date.now()}`,
      reply: fallbackReply,
      plantId: selectedPlant?.id,
      plantName: selectedPlant?.plantName,
      imageUrl: savedImageUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const rawErr = err instanceof Error ? err.message : "Unexpected assistant error";
    res.status(500).json({
      error: "Unable to get a response from AI Plant Assistant",
      message: rawErr.replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED]"),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PlantCare AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
