import express from "express";
import cors from "cors";
import helmet from "helmet";
import uploadRouter from "./routes/upload";
import processRouter from "./routes/process";
import exportRouter from "./routes/export";
import webhooksRouter from "./routes/webhooks";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" }));

// Raw body needed for webhook signature verification
app.use("/webhooks", express.raw({ type: "*/*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/upload", uploadRouter);
app.use("/process", processRouter);
app.use("/export", exportRouter);
app.use("/webhooks", webhooksRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
