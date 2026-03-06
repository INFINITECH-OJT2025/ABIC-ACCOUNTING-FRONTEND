import { z } from "zod"
import { VALIDATION_CONSTRAINTS } from "@/lib/validation/constraints"

const checklistTaskText = z
  .string()
  .trim()
  .min(VALIDATION_CONSTRAINTS.checklistTemplate.task.min)
  .max(VALIDATION_CONSTRAINTS.checklistTemplate.task.max)

export const checklistTemplateTasksSchema = z
  .array(
    z.object({
      task: checklistTaskText,
      sort_order: z.number().int().optional(),
      is_active: z.boolean().optional(),
    })
  )
  .min(1)

export const onboardingRecordSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.onboardingRecord.name.min)
    .max(VALIDATION_CONSTRAINTS.onboardingRecord.name.max),
  position: z
    .string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.onboardingRecord.position.min)
    .max(VALIDATION_CONSTRAINTS.onboardingRecord.position.max),
  department: z
    .string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.onboardingRecord.department.min)
    .max(VALIDATION_CONSTRAINTS.onboardingRecord.department.max),
  startDate: z.string().trim().min(1),
})

export const directoryContactSchema = z.object({
  type: z.string().trim().min(1).max(VALIDATION_CONSTRAINTS.directory.contactType.max),
  label: z.string().trim().max(VALIDATION_CONSTRAINTS.directory.contactLabel.max).optional(),
  value: z
    .string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.directory.contactValue.min)
    .max(VALIDATION_CONSTRAINTS.directory.contactValue.max),
})

export const directoryProcessSchema = z.object({
  process: z
    .string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.directory.processStep.min)
    .max(VALIDATION_CONSTRAINTS.directory.processStep.max),
})

export const directoryDraftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.directory.agencyName.min)
    .max(VALIDATION_CONSTRAINTS.directory.agencyName.max),
  full_name: z.string().trim().max(VALIDATION_CONSTRAINTS.directory.agencyFullName.max).optional(),
  summary: z.string().trim().max(VALIDATION_CONSTRAINTS.directory.agencySummary.max).optional(),
  contacts: z.array(directoryContactSchema),
  processes: z.array(directoryProcessSchema),
})

export const generalContactRowSchema = z.object({
  establishment_name: z
    .string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.directory.generalEstablishment.min)
    .max(VALIDATION_CONSTRAINTS.directory.generalEstablishment.max),
  services: z.string().trim().max(VALIDATION_CONSTRAINTS.directory.generalServices.max).optional(),
  contact_person: z
    .string()
    .trim()
    .max(VALIDATION_CONSTRAINTS.directory.generalContactPerson.max)
    .optional(),
  value: z
    .string()
    .trim()
    .min(VALIDATION_CONSTRAINTS.directory.generalValue.min)
    .max(VALIDATION_CONSTRAINTS.directory.generalValue.max),
})

export const generalContactsSchema = z.array(generalContactRowSchema).min(1)
