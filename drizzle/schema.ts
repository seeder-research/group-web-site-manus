import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users (auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Member Categories ────────────────────────────────────────────────────────
// Order matches the display order on the Team page:
// 1) PI, 2) Postdoc, 3) PhD, 4) M.Eng., 5) FYP, 6) Other students, 7) Interns, 8) Research Staff
export const MEMBER_CATEGORIES = [
  "Principal Investigator",
  "Postdoctoral Fellow",
  "Graduate Student (Ph.D.)",
  "Graduate Student (M.Eng.)",
  "Graduate Student (M.Sc.)",
  "FYP Student",
  "Student",
  "Intern",
  "Research Staff",
] as const;

export type MemberCategory = (typeof MEMBER_CATEGORIES)[number];

// ─── Team Members ─────────────────────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  /** Honorific / academic title, e.g. 'Dr.', 'Prof.', 'Mr.', 'Ms.' */
  title: varchar("title", { length: 64 }),
  firstName: varchar("firstName", { length: 128 }),
  lastName: varchar("lastName", { length: 128 }),
  category: varchar("category", { length: 64 }).notNull(),
  /** Role / position as free text, e.g. 'Graduate Student (PhD)' */
  role: varchar("role", { length: 255 }),
  isAlumni: boolean("isAlumni").default(false).notNull(),
  photoUrl: text("photoUrl"),
  biography: text("biography"),
  email: varchar("email", { length: 320 }),
  researchInterests: text("researchInterests"),
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Publications ─────────────────────────────────────────────────────────────
export const publications = mysqlTable("publications", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  year: int("year"),
  publicationDate: varchar("publicationDate", { length: 32 }),
  journal: text("journal"),
  pages: varchar("pages", { length: 128 }),
  doi: varchar("doi", { length: 512 }),
  /** Direct URL to the paper (publisher page, arXiv, etc.) */
  url: text("url"),
  /** Comma-separated list of related research project slugs */
  relatedProjects: text("relatedProjects"),
  /** 'journal' | 'conference' | 'other' */
  pubType: varchar("pubType", { length: 32 }).default("journal"),
  bibtex: text("bibtex"),
  abstract: text("abstract"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Publication = typeof publications.$inferSelect;
export type InsertPublication = typeof publications.$inferInsert;

// ─── Research Projects ────────────────────────────────────────────────────────
export const researchProjects = mysqlTable("research_projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  fullContent: text("fullContent"),
  imageUrl: text("imageUrl"),
  /** JSON array of {url: string, caption: string} objects for the in-page gallery */
  galleryImages: json("galleryImages").$type<{ url: string; caption: string }[]>(),
  tags: text("tags"),
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResearchProject = typeof researchProjects.$inferSelect;
export type InsertResearchProject = typeof researchProjects.$inferInsert;

// ─── News Posts ───────────────────────────────────────────────────────────────
export const newsPosts = mysqlTable("news_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  externalLink: text("externalLink"),
  externalLinkLabel: varchar("externalLinkLabel", { length: 255 }),
  postType: varchar("postType", { length: 64 }).default("general"),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Singapore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsPost = typeof newsPosts.$inferSelect;
export type InsertNewsPost = typeof newsPosts.$inferInsert;

// ─── Contact Messages ─────────────────────────────────────────────────────────
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 512 }),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;
