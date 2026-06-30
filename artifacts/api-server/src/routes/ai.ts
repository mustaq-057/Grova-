import { Router } from "express";
import { logger } from "../lib/logger";
import { HfInference } from "@huggingface/inference";

const router = Router();

router.post("/ai/inpaint", async (req, res) => {
  try {
    const { image, mask, prompt } = req.body;

    if (!process.env.HF_TOKEN) {
      return res.status(500).json({ error: "HF_TOKEN is missing in .env. Please add it to use AI features." });
    }

    const hf = new HfInference(process.env.HF_TOKEN);
    logger.info("Sending inpainting request to Hugging Face...");

    // Convert base64 to Blob
    const imageB64 = image.replace(/^data:image\/\w+;base64,/, "");
    const maskB64 = mask.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(imageB64, 'base64');
    const maskBuffer = Buffer.from(maskB64, 'base64');
    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    const maskBlob = new Blob([maskBuffer], { type: 'image/jpeg' });

    let resultBlob: Blob | null = null;
    let retries = 3;
    let delay = 10000;

    for (let i = 0; i < retries; i++) {
      try {
        resultBlob = await hf.imageToImage({
          model: 'runwayml/stable-diffusion-inpainting',
          inputs: imageBlob,
          parameters: {
             prompt: prompt || "clean background, seamless, high quality, background removal",
             negative_prompt: "object, person, artifact, blurry, mess",
          }
        });
        break; // Success
      } catch (e: any) {
        if (e.message?.includes("currently loading") || e.message?.includes("Service Unavailable")) {
           logger.info(`Model loading, retrying in ${delay/1000}s...`);
           if (i === retries - 1) {
              return res.status(503).json({ error: "The AI model is waking up (cold start). Please try clicking generate again in 20 seconds!" });
           }
           await new Promise(r => setTimeout(r, delay));
        } else {
           logger.error({ error: e }, "Hugging Face inpainting error");
           return res.status(500).json({ error: `Hugging Face AI error: ${e.message}.` });
        }
      }
    }

    if (!resultBlob) {
      return res.status(500).json({ error: "AI failed to process request after retries." });
    }

    const arrayBuffer = await resultBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const resultUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    return res.json({ resultUrl });
  } catch (error) {
    logger.error({ err: error }, 'AI Inpaint failed');
    return res.status(500).json({ error: 'AI Inpainting failed internally' });
  }
});

export default router;
