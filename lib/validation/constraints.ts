export const VALIDATION_CONSTRAINTS = {
  checklistTemplate: {
    task: {
      min: 2,
      max: 500,
    },
  },
  onboardingRecord: {
    name: { min: 2, max: 255 },
    position: { min: 2, max: 255 },
    department: { min: 2, max: 255 },
  },
  directory: {
    agencyName: { min: 2, max: 255 },
    agencyFullName: { max: 255 },
    agencySummary: { max: 2000 },
    processStep: { min: 2, max: 1000 },
    contactType: { max: 100 },
    contactLabel: { max: 255 },
    contactValue: { min: 2, max: 1000 },
    generalEstablishment: { min: 2, max: 255 },
    generalServices: { max: 255 },
    generalContactPerson: { max: 255 },
    generalValue: { min: 2, max: 1000 },
  },
} as const
