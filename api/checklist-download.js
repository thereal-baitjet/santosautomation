import { promises as fs } from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "public", "AI_Audit_Checklist_SantosAutomation.pdf");
    const data = await fs.readFile(filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=\"AI_Audit_Checklist_SantosAutomation.pdf\"");
    res.status(200).send(data);
  } catch (err) {
    res.status(404).json({ error: "Checklist not found" });
  }
}
