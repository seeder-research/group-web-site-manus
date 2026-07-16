import { eq, desc, asc, and, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  teamMembers,
  InsertTeamMember,
  publications,
  InsertPublication,
  researchProjects,
  InsertResearchProject,
  newsPosts,
  InsertNewsPost,
  contactMessages,
  InsertContactMessage,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Team Members ─────────────────────────────────────────────────────────────
export async function getAllTeamMembers(isAlumni = false) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isAlumni, isAlumni))
    .orderBy(asc(teamMembers.displayOrder), asc(teamMembers.name));
}

export async function getTeamMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  return result[0];
}

export async function createTeamMember(data: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamMembers).values(data);
  return result;
}

export async function updateTeamMember(id: number, data: Partial<InsertTeamMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(teamMembers).where(eq(teamMembers.id, id));
}

// ─── Publications ─────────────────────────────────────────────────────────────
export async function getDuplicatePublications() {
  const db = await getDb();
  if (!db) return [];
  // Fetch all publications and find duplicates by normalized title or DOI
  const all = await db.select().from(publications).orderBy(asc(publications.year), asc(publications.title));
  const groups: Array<{ key: string; type: "title" | "doi"; entries: typeof all }> = [];
  const seen = new Map<string, typeof all>();

  for (const pub of all) {
    // Normalize title: lowercase, strip punctuation, collapse whitespace
    const normTitle = (pub.title ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    const normDoi = (pub.doi ?? "").toLowerCase().trim();

    if (normDoi) {
      const existing = seen.get(`doi:${normDoi}`);
      if (existing) {
        existing.push(pub);
      } else {
        seen.set(`doi:${normDoi}`, [pub]);
      }
    } else if (normTitle) {
      const existing = seen.get(`title:${normTitle}`);
      if (existing) {
        existing.push(pub);
      } else {
        seen.set(`title:${normTitle}`, [pub]);
      }
    }
  }

  for (const [key, entries] of Array.from(seen.entries())) {
    if (entries.length > 1) {
      const type = key.startsWith("doi:") ? "doi" : "title";
      groups.push({ key, type, entries });
    }
  }
  return groups;
}

export async function getAllPublications(filters?: {
  search?: string;
  pubType?: string;
  year?: number;
  relatedProject?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.pubType) {
    conditions.push(eq(publications.pubType, filters.pubType));
  }
  if (filters?.year) {
    conditions.push(eq(publications.year, filters.year));
  }
  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      sql`(${publications.title} LIKE ${term} OR ${publications.authors} LIKE ${term} OR ${publications.journal} LIKE ${term})`
    );
  }
  if (filters?.relatedProject) {
    conditions.push(like(publications.relatedProjects, `%${filters.relatedProject}%`));
  }

  const query = db.select().from(publications);
  const withWhere = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return withWhere.orderBy(desc(publications.year), desc(publications.createdAt));
}

export async function getPublicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(publications).where(eq(publications.id, id)).limit(1);
  return result[0];
}

export async function createPublication(data: InsertPublication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(publications).values(data);
}

export async function updatePublication(id: number, data: Partial<InsertPublication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(publications).set(data).where(eq(publications.id, id));
}

export async function deletePublication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(publications).where(eq(publications.id, id));
}

// ─── Research Projects ────────────────────────────────────────────────────────
export async function getAllResearchProjects(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(researchProjects);
  if (activeOnly) {
    return query.where(eq(researchProjects.isActive, true)).orderBy(asc(researchProjects.displayOrder));
  }
  return query.orderBy(asc(researchProjects.displayOrder));
}

export async function getResearchProjectBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(researchProjects).where(eq(researchProjects.slug, slug)).limit(1);
  return result[0];
}

export async function getResearchProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(researchProjects).where(eq(researchProjects.id, id)).limit(1);
  return result[0];
}

export async function createResearchProject(data: InsertResearchProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(researchProjects).values(data);
}

export async function updateResearchProject(id: number, data: Partial<InsertResearchProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(researchProjects).set(data).where(eq(researchProjects.id, id));
}

export async function deleteResearchProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(researchProjects).where(eq(researchProjects.id, id));
}

// ─── News Posts ───────────────────────────────────────────────────────────────
export async function getAllNewsPosts(limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(newsPosts).orderBy(desc(newsPosts.publishedAt));
  if (limit) return query.limit(limit);
  return query;
}

export async function getNewsPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(newsPosts).where(eq(newsPosts.id, id)).limit(1);
  return result[0];
}

export async function createNewsPost(data: InsertNewsPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(newsPosts).values(data);
}

export async function updateNewsPost(id: number, data: Partial<InsertNewsPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(newsPosts).set(data).where(eq(newsPosts.id, id));
}

export async function deleteNewsPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(newsPosts).where(eq(newsPosts.id, id));
}

// ─── Contact Messages ─────────────────────────────────────────────────────────
export async function createContactMessage(data: InsertContactMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(contactMessages).values(data);
}

export async function getAllContactMessages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function markContactMessageRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id));
}
