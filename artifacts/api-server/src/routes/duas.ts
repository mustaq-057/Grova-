import { Router } from "express";
import { randomUUID } from "crypto";

interface Dua {
  id: string;
  arabic: string;
  translation: string;
  author: string;
  timestamp: string;
}

const duas: Dua[] = [
  {
    id: "d1",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    translation: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
    author: "shared",
    timestamp: new Date().toISOString(),
  },
  {
    id: "d2",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    translation: "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.",
    author: "shared",
    timestamp: new Date().toISOString(),
  },
  {
    id: "d3",
    arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ",
    translation: "O Allah, bless us in what You have provided for us and protect us from the punishment of the Fire.",
    author: "shared",
    timestamp: new Date().toISOString(),
  },
];

const router = Router();

router.get("/duas", (_req, res) => {
  res.json(duas);
});

router.post("/duas", (req, res) => {
  const { arabic, translation, author } = req.body as {
    arabic: string;
    translation?: string;
    author: string;
  };
  if (!arabic || !author) {
    res.status(400).json({ error: "arabic and author required" });
    return;
  }
  const dua: Dua = {
    id: randomUUID(),
    arabic,
    translation: translation || "",
    author,
    timestamp: new Date().toISOString(),
  };
  duas.push(dua);
  res.json(dua);
});

router.delete("/duas/:id", (req, res) => {
  const idx = duas.findIndex((d) => d.id === req.params["id"]);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  duas.splice(idx, 1);
  res.json({ success: true });
});

export default router;
