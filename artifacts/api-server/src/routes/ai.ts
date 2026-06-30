import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

router.post("/ai/inpaint", async (req, res) => {
  try {
    const { image, mask, prompt } = req.body;

    if (!process.env.FAL_KEY) {
      return res.status(500).json({ error: "FAL_KEY is missing in .env. Please add it to use AI features." });
    }

    logger.info("Sending inpainting request to Fal.ai...");

    // Using fal-ai/fast-sdxl/inpainting or similar model
    const response = await fetch("https://fal.run/fal-ai/fast-sdxl/inpainting", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image_url: image,
        mask_url: mask,
        prompt: prompt || "clean background, seamless, high quality",
        negative_prompt: "artifacts, blurry, ugly, badly drawn, distorted",
        strength: 0.95,
        num_inference_steps: 20
      })
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ error: text }, "Fal.ai inpainting error");
      return res.status(500).json({ error: `AI error: ${response.statusText}` });
    }

    const data = await response.json();
    return res.json({ resultUrl: data.images[0].url });
  } catch (error) {
    logger.error({ err: error }, 'AI Inpaint failed');
    return res.status(500).json({ error: 'AI Inpainting failed internally' });
  }
});

export default router;
