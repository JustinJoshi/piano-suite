import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const MAX_PATTERNS_PER_TOOL = 50;
const MAX_NAME_LENGTH = 80;

async function currentUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User not found");
  }
  return user._id;
}

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
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
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
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
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
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
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
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
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
