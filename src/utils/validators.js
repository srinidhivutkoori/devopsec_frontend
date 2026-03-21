// utils/validators.js
// Centralised Yup validation schemas for every form in the application.
// Keeping all schemas in one file makes it easy to synchronise validation
// rules with backend constraints and reduces duplication across components.
// Each schema is exported individually so components only import what they need.

import * as yup from 'yup'

// ---------------------------------------------------------------------------
// Authentication schemas
// ---------------------------------------------------------------------------

/** Login form: username + password only */
export const loginSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

/** Registration form: full user signup fields */
export const registerSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Must be a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters'),
})

// ---------------------------------------------------------------------------
// Board schemas
// ---------------------------------------------------------------------------

/** Create / edit board.  Dimensions are validated against backend limits. */
export const boardSchema = yup.object({
  name: yup
    .string()
    .required('Board name is required')
    .min(1, 'Board name cannot be empty')
    .max(200, 'Board name must be at most 200 characters'),
  width: yup
    .number()
    .typeError('Width must be a number')
    .required('Width is required')
    .min(100, 'Width must be at least 100')
    .max(10000, 'Width must be at most 10000'),
  height: yup
    .number()
    .typeError('Height must be a number')
    .required('Height is required')
    .min(100, 'Height must be at least 100')
    .max(10000, 'Height must be at most 10000'),
  backgroundColor: yup
    .string()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Must be a valid hex colour (e.g. #ffffff)')
    .default('#ffffff'),
})

// ---------------------------------------------------------------------------
// Element schema
// ---------------------------------------------------------------------------

/** Used in the ElementProperties side-panel to validate position / size edits */
export const elementSchema = yup.object({
  x: yup
    .number()
    .typeError('X must be a number')
    .required('X position is required')
    .min(0, 'X must be 0 or greater'),
  y: yup
    .number()
    .typeError('Y must be a number')
    .required('Y position is required')
    .min(0, 'Y must be 0 or greater'),
  width: yup
    .number()
    .typeError('Width must be a number')
    .required('Width is required')
    .min(1, 'Width must be at least 1'),
  height: yup
    .number()
    .typeError('Height must be a number')
    .required('Height is required')
    .min(1, 'Height must be at least 1'),
  content: yup.string().max(5000, 'Content must be at most 5000 characters'),
})

// ---------------------------------------------------------------------------
// Team schema
// ---------------------------------------------------------------------------

export const teamSchema = yup.object({
  name: yup
    .string()
    .required('Team name is required')
    .min(1, 'Team name cannot be empty')
    .max(200, 'Team name must be at most 200 characters'),
})

// ---------------------------------------------------------------------------
// Permission schema
// ---------------------------------------------------------------------------

export const permissionSchema = yup.object({
  // Either userId or teamId must be provided - handled at the component level
  permissionLevel: yup
    .string()
    .required('Permission level is required')
    .oneOf(['VIEW', 'EDIT', 'ADMIN'], 'Invalid permission level'),
})

// ---------------------------------------------------------------------------
// Snapshot schema
// ---------------------------------------------------------------------------

export const snapshotSchema = yup.object({
  description: yup
    .string()
    .required('Description is required')
    .min(1, 'Description cannot be empty')
    .max(500, 'Description must be at most 500 characters'),
})
