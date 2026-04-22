// convex/convex.config.ts
import { defineApp } from "convex/server";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(prosemirrorSync);
app.use(agent);

export default app;
