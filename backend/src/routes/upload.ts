import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { supabase } from "../lib/supabase";
import { requireAuth, checkQuota, type AuthRequest } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 * 1024 } });

router.post("/", requireAuth, checkQuota, upload.single("file"), async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const clipId = randomUUID();
  const ext = req.file.originalname.split(".").pop();
  const path = `${req.userId}/${clipId}.${ext}`;

  const { error } = await supabase.storage
    .from("raw-uploads")
    .upload(path, req.file.buffer, { contentType: req.file.mimetype });

  if (error) {
    res.status(500).json({ error: "Upload failed" });
    return;
  }

  const { data: clip } = await supabase
    .from("clips")
    .insert({
      id: clipId,
      user_id: req.userId,
      project_id: req.body.projectId,
      original_name: req.file.originalname,
      storage_path: path,
      size_bytes: req.file.size,
    })
    .select()
    .single();

  res.json({ clipId: clip?.id, path });
});

export default router;
