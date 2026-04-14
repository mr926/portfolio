/**
 * 数据类型定义 — 与 Prisma schema 对应，供前端组件使用
 */

export type ProjectStatus = "draft" | "published" | "hidden";
export type CardType = "image" | "text" | "panorama";

export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMeta {
  id: string;
  projectId: string;
  key: string;
  value: string;
  order: number;
}

export interface ProjectCard {
  id: string;
  projectId: string;
  type: CardType;
  order: number;
  imageUrl?: string | null;
  imageAlt?: string | null;
  content?: string | null;
  panoramaUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  categoryId: string;
  category?: Category;
  coverImage: string;
  status: ProjectStatus;
  isPinned: boolean;
  order: number;
  cards?: ProjectCard[];
  metas?: ProjectMeta[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  siteTagline: string;
  landingEnabled: boolean;
  landingBgDesktop: string;
  landingBgMobile: string;
  landingStayMs: number;
  landingAnimMs: number;
  instagram: string;
  linkedin: string;
  email: string;
  location: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Response types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
