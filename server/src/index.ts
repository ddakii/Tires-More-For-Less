import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";
import { crmRouter } from "./routes/crm.js";
import { workflowRouter } from "./routes/workflow.js";
import { ensureDatabase } from "./bootstrap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, business: "Tires & More For Less" }));

app.use("/api/auth", authRouter);
app.use("/api", publicRouter);
app.use("/api/crm", crmRouter);
app.use("/api/crm", workflowRouter);

const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

async function main() {
  await ensureDatabase();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tires & More For Less running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
