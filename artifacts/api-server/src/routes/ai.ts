import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

router.post("/ai/inpaint", async (req, res) => {
  try {
    const { image, mask, prompt } = req.body;

    if (!process.env.HF_TOKEN) {
      return res.status(500).json({ error: "HF_TOKEN is missing in .env. Please add it to use AI features." });
    }

    logger.info("Sending inpainting request to Hugging Face...");

    // Hugging Face Inference API expects base64 without the data URI prefix for the payload
    const imageB64 = image.replace(/^data:image\/\w+;base64,/, "");
    const maskB64 = mask.replace(/^data:image\/\w+;base64,/, "");

    let response;
    let retries = 3;
    let delay = 10000;

    for (let i = 0; i < retries; i++) {
      response = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt || "clean background, seamless, high quality, background removal",
            image: imageB64,
            mask_image: maskB64,
          }),
        }
      );

      if (response.ok) break;

      const errorText = await response.text();
      let errorJson: any = {};
      try { errorJson = JSON.parse(errorText); } catch(e) {}

      if (errorJson.error && errorJson.error.includes("currently loading")) {
         logger.info(`Model loading, retrying in ${delay/1000}s...`);
         if (i === retries - 1) {
            return res.status(503).json({ error: "The AI model is waking up (cold start). Please try clicking generate again in 20 seconds!" });
         }
         await new Promise(r => setTimeout(r, delay));
      } else {
         logger.error({ error: errorText, status: response.status }, "Hugging Face inpainting error");
         return res.status(500).json({ error: `Hugging Face AI error: ${errorJson.error || response.statusText}.` });
      }
    }

    if (!response || !response.ok) {
      return res.status(500).json({ error: "AI failed to process request after retries." });
    }

    // Hugging Face returns raw image bytes
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const resultUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    return res.json({ resultUrl });
  } catch (error) {
    logger.error({ err: error }, 'AI Inpaint failed');
    return res.status(500).json({ error: 'AI Inpainting failed internally' });
  }
});

export default router;
