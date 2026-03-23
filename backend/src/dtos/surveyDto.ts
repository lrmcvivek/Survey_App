import { z } from 'zod';

const YesNoSchema = z.enum(['YES', 'NO']);

const SurveyDetailsSchema = z.object({
  ulbId: z.string().uuid(),
  zoneId: z.string().uuid(),
  wardId: z.string().uuid(),
  mohallaId: z.string().uuid(),
  surveyTypeId: z.number().int().positive(),
  entryDate: z.string().datetime(),
  parcelId: z.number().optional().nullable(),
  mapId: z.number(),
  gisId: z.string().max(12),
  subGisId: z.string().max(15).optional().nullable(),
});

const PropertyDetailsSchema = z.object({
  responseTypeId: z.number().int().positive(),
  oldHouseNumber: z.string().max(15).optional().nullable(),
  electricityConsumerName: z.string().max(50).optional().nullable(),
  waterSewerageConnectionNumber: z.string().max(50).optional().nullable(),
  respondentName: z.string().max(50),
  respondentStatusId: z.number().int().positive(),
});

const OwnerDetailsSchema = z.object({
  ownerName: z.string().max(50),
  fatherHusbandName: z.string().max(50),
  mobileNumber: z.string().max(20).optional().nullable(),
  aadharNumber: z.string().length(12).optional().nullable(),
});

const LocationDetailsSchema = z.object({
  propertyLatitude: z.number().min(0).max(180).optional().nullable(),
  propertyLongitude: z.number().min(0).max(360).optional().nullable(),
  assessmentYear: z.string().max(20),
  propertyTypeId: z.number().int().positive().optional().nullable(),
  buildingName: z.string().optional().nullable(),
  roadTypeId: z.number().int().positive(),
  constructionYear: z.string().max(20),
  constructionTypeId: z.number().int().positive(),
  addressRoadName: z.string(),
  locality: z.string().optional().nullable(),
  pinCode: z.number(),
  landmark: z.string().optional().nullable(),
  fourWayEast: z.string().optional().nullable(),
  fourWayWest: z.string().optional().nullable(),
  fourWayNorth: z.string().optional().nullable(),
  fourWaySouth: z.string().optional().nullable(),
  newWardNumber: z.string().max(20),
});

const OtherDetailsSchema = z.object({
  waterSourceId: z.number().int().positive(),
  rainWaterHarvestingSystem: YesNoSchema,
  plantation: YesNoSchema.optional().nullable(),
  parking: YesNoSchema.optional().nullable(),
  pollution: YesNoSchema.optional().nullable(),
  pollutionMeasurementTaken: z.string().optional().nullable(),
  waterSupplyWithin200Meters: YesNoSchema,
  sewerageLineWithin100Meters: YesNoSchema,
  disposalTypeId: z.number().int().positive(),
  totalPlotArea: z.number(),
  builtupAreaOfGroundFloor: z.number(),
  remarks: z.string().optional().nullable(),
});

// Residential Floor Details
// All fields marked * are mandatory as per requirements
const ResidentialPropertyAssessmentSchema = z.object({
  floorNumberId: z.number().int().positive(), // Floor Number (from Floor Number Master)
  occupancyStatusId: z.number().int().positive(), // Occupancy Status (from Occupancy Status Master)
  constructionNatureId: z.number().int().positive(), // Construction Nature (from Construction Nature Master)
  coveredArea: z.number(), // Covered Area (manual entry)
  allRoomVerandaArea: z.number().optional().nullable(), // Total Rooms/Veranda Area (manual entry)
  allBalconyKitchenArea: z.number().optional().nullable(), // Total Balcony/Kitchen Area (manual entry)
  allGarageArea: z.number().optional().nullable(), // All Garage Area (manual entry)
  carpetArea: z.number(), // Carpet Area (manual entry)
});

// Non-Residential Floor Details
// All fields marked * are mandatory as per requirements
const NonResidentialPropertyAssessmentSchema = z.object({
  floorNumberId: z.number().int().positive(), // Floor Number (from Floor Number Master)
  nrPropertyCategoryId: z.number().int().positive(), // Property Category (from NR Property Category Master)
  nrSubCategoryId: z.number().int().positive(), // Property Sub Category (from NR Property Sub Category Master)
  establishmentName: z.string(), // Establishment Name (manual entry)
  licenseNo: z.string().max(20).optional().nullable(), // License Number (manual entry, optional)
  licenseExpiryDate: z.string()
    .refine(
      (val) => {
        // Accept both date-only (YYYY-MM-DD) and datetime (ISO) formats
        const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
        const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        return dateOnlyRegex.test(val) || datetimeRegex.test(val);
      },
      { message: 'Invalid date format. Expected YYYY-MM-DD or ISO datetime' }
    )
    .transform((val) => {
      // If it's a date-only string (YYYY-MM-DD), append T00:00:00.000Z
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyRegex.test(val)) {
        return `${val}T00:00:00.000Z`;
      }
      return val;
    })
    .pipe(z.string().datetime())
    .optional()
    .nullable(), // License Expiry Date (manual entry, optional)
  occupancyStatusId: z.number().int().positive(), // Occupancy Status (from Occupancy Status Master)
  constructionNatureId: z.number().int().positive(), // Construction Nature (from Construction Nature Master)
  builtupArea: z.number(), // Built-up Area (manual entry)
});

// Helper: surveyTypeId to name mapping (should match DB seed)
const surveyTypeIdToName: Record<number, string> = {
  1: 'RESIDENTIAL',
  2: 'NON RESIDENTIAL',
  3: 'MIX',
};

export const CreateSurveyDtoSchema = z.object({
  surveyDetails: SurveyDetailsSchema,
  propertyDetails: PropertyDetailsSchema,
  ownerDetails: OwnerDetailsSchema,
  locationDetails: LocationDetailsSchema,
  otherDetails: OtherDetailsSchema,
  residentialPropertyAssessments: z.array(ResidentialPropertyAssessmentSchema).optional().nullable(),
  nonResidentialPropertyAssessments: z.array(NonResidentialPropertyAssessmentSchema).optional().nullable(),
}).superRefine((data, ctx) => {
  const surveyTypeId = data.surveyDetails?.surveyTypeId;
  const surveyTypeName = surveyTypeIdToName[surveyTypeId];
  const propertyTypeId = data.locationDetails?.propertyTypeId;
  if (surveyTypeName === 'RESIDENTIAL' || surveyTypeName === 'MIX') {
    if (!propertyTypeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'propertyTypeId is required for Residential and Mix survey types.',
        path: ['locationDetails', 'propertyTypeId'],
      });
    }
  } else if (surveyTypeName === 'NON RESIDENTIAL') {
    if (propertyTypeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'propertyTypeId should not be present for Non-Residential survey type.',
        path: ['locationDetails', 'propertyTypeId'],
      });
    }
  }
});

export type CreateSurveyDto = z.infer<typeof CreateSurveyDtoSchema>; 