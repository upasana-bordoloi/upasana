import { z } from 'zod';

// Authentication Validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// Painting Model Validation
export const paintingSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be url-friendly (lowercase, numbers, and dashes)'),
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  story: z.string().max(2000, 'Story cannot exceed 2000 characters').optional().nullable(),
  description: z.string().min(1, 'Description is required').max(5000, 'Description cannot exceed 5000 characters'),
  price: z.number().positive('Price must be greater than zero'),
  currency: z.string().default('USD'),
  medium: z.string().min(1, 'Medium is required'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  year_created: z.number().int().min(1900).refine(
    (year) => year <= new Date().getFullYear(),
    { message: "Creation year cannot be in the future" }
  ),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  availability: z.enum(['AVAILABLE', 'SOLD', 'RESERVED']).default('AVAILABLE'),
  thumbnail_url: z.string().url('Invalid thumbnail URL').optional().nullable(),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  additional_images: z.string().optional().nullable(),
  seo_title: z.string().max(70, 'SEO Title should be 70 characters or less').optional().nullable(),
  seo_description: z.string().max(160, 'SEO Description should be 160 characters or less').optional().nullable(),
  og_image: z.string().url('Invalid Open Graph image URL').optional().nullable()
});

// Category & Collection Validation
export const categorySchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable()
});

export const collectionSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  image_url: z.string().url('Invalid cover image URL').optional().nullable()
});

// Order & Checkout Validation
export const orderItemSchema = z.object({
  painting_id: z.string().min(1, 'Painting ID is required'),
  price: z.number().positive()
});

export const orderSchema = z.object({
  customer_email: z.string().email('Invalid email address'),
  customer_first_name: z.string().min(1, 'First name is required'),
  customer_last_name: z.string().min(1, 'Last name is required'),
  customer_phone: z.string().min(5, 'Phone number is required'),
  shipping_address: z.string().min(1, 'Shipping address is required'),
  shipping_city: z.string().min(1, 'City is required'),
  shipping_state: z.string().min(1, 'State/Province is required'),
  shipping_postal_code: z.string().min(1, 'Postal/ZIP code is required'),
  shipping_country: z.string().min(1, 'Country is required'),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one painting')
});

// User (Admin/Staff) Management Validation
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']),
  is_active: z.boolean().default(true)
});

// Site Settings Validation
export const siteSettingsSchema = z.object({
  hero_title: z.string().min(1, 'Hero title is required'),
  hero_subtitle: z.string().optional().nullable(),
  artist_bio: z.string().min(1, 'Artist biography is required'),
  social_facebook: z.string().url().or(z.literal('')).optional().nullable(),
  social_instagram: z.string().url().or(z.literal('')).optional().nullable(),
  social_pinterest: z.string().url().or(z.literal('')).optional().nullable(),
  contact_email: z.string().email('Invalid email address'),
  contact_phone: z.string().optional().nullable(),
  contact_address: z.string().optional().nullable(),
  footer_content: z.string().optional().nullable(),
  seo_default_title: z.string().min(1, 'Default SEO title is required'),
  seo_default_description: z.string().min(1, 'Default SEO description is required'),
  imgbb_api_key: z.string().optional().nullable()
});

// Contact Form Validation
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(5, 'Message must be at least 5 characters')
});
