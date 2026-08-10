import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUserId, ensureUserId } from "./lib/auth";

const MAX_PATTERNS_PER_TOOL = 50;
const MAX_NAME_LENGTH = 80;

function normalizeName(name: string): string {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (!trimmed) {
    throw new Error("Pattern name is required");
  }
  return trimmed;
}

function normalizeTool(tool: string): string {
  const trimmed = tool.trim();
  if (!trimmed || trimmed.length > 64) {
    throw new Error("Invalid tool id");
  }
  return trimmed;
}

export const listSavedPatterns = query({
  args: { tool: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("savedPatterns"),
      name: v.string(),
      params: v.any(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (!userId) {
      return [];
    }

    const tool = normalizeTool(args.tool);
    const patterns = await ctx.db
      .query("savedPatterns")
      .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", tool))
      .collect();

    return patterns
      .map((p) => ({
        _id: p._id,
        name: p.name,
        params: p.params,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const savePattern = mutation({
  args: {
    tool: v.string(),
    name: v.string(),
    params: v.any(),
  },
  returns: v.id("savedPatterns"),
  handler: async (ctx, args) => {
    const userId = await ensureUserId(ctx);
    const tool = normalizeTool(args.tool);
    const name = normalizeName(args.name);
    const now = Date.now();

    const existing = await ctx.db
      .query("savedPatterns")
      .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", tool))
      .collect();

    if (existing.length >= MAX_PATTERNS_PER_TOOL) {
      throw new Error(
        `Pattern limit reached (${MAX_PATTERNS_PER_TOOL} per lab). Delete one to save another.`
      );
    }

    return await ctx.db.insert("savedPatterns", {
      userId,
      tool,
      name,
      params: args.params,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const renamePattern = mutation({
  args: {
    patternId: v.id("savedPatterns"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserId(ctx);
    const name = normalizeName(args.name);
    const pattern = await ctx.db.get(args.patternId);
    if (!pattern) {
      throw new Error("Pattern not found");
    }
    if (pattern.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.patternId, {
      name,
      updatedAt: Date.now(),
    });
  },
});

export const deletePattern = mutation({
  args: {
    patternId: v.id("savedPatterns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserId(ctx);
    const pattern = await ctx.db.get(args.patternId);
    if (!pattern) {
      throw new Error("Pattern not found");
    }
    if (pattern.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.patternId);
  },
});
