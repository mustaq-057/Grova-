import { Router } from "express";
import { logger } from "../lib/logger";
import * as fal from "@fal-ai/serverless-client";

const router = Router();

router.post("/ai/inpaint", async (req, res) => {
  try {
    const { image, mask, prompt } = req.body;

    if (!process.env.FAL_KEY) {
      return res.status(500).json({ error: "FAL_KEY is missing in .env. Please add it to use AI features." });
    }

    logger.info("Sending inpainting request to Fal.ai...");

    const result: any = await fal.subscribe("fal-ai/fast-sdxl/inpainting", {
      input: {
        prompt: prompt || "clean background, empty, seamless, high quality, pure",
        negative_prompt: "object, person, artifact, blurry, mess, shapes, drawing",
        image_url: image,
        mask_url: mask,
      }
    });

    if (!result || !result.images || !result.images[0]) {
       return res.status(500).json({ error: "Fal.ai failed to generate an image." });
    }

    return res.json({ resultUrl: result.images[0].url });
  } catch (error) {
    logger.error({ err: error }, 'AI Inpaint failed');
    return res.status(500).json({ error: 'AI Inpainting failed internally' });
  }
});

export default router;
