import { Request, Response } from 'express';
import { CreateSurveyDtoSchema } from '../dtos/surveyDto';
import * as surveyService from '../services/surveyService';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    roles: string[];
  };
}

export const submitSurvey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const surveyData = CreateSurveyDtoSchema.parse(req.body);
    const uploadedById = req.user?.userId;

    if (!uploadedById) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const newSurvey = await surveyService.createSurvey(surveyData, uploadedById);
    res.status(201).json(newSurvey);
  } catch (error) {
    // Enhanced logging for all error types
    console.log('CATCH BLOCK REACHED');
    console.log('Error type:', error?.constructor?.name);
    console.log('Error object:', error);

    if (error instanceof z.ZodError) {
      // Log the full Zod error details
      console.log('Zod validation error:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ message: 'Invalid request body', errors: error.errors });
    }
    if (error instanceof Error) {
      let errors;
      try {
        errors = JSON.parse(error.message);
      } catch {
        errors = error.message;
      }
      // Log generic error
      console.log('Error submitting survey:', errors);
      return res.status(400).json({ message: 'Invalid request body', errors });
    }
    // Fallback for unknown error types
    console.log('Unknown error:', error);
    res.status(500).json({ message: 'Error submitting survey', error });
  }
};

export const getSurveyByGisId = async (req: Request, res: Response) => {
  try {
    const { gisId } = req.params;
    if (!gisId) {
      return res.status(400).json({ message: 'GIS ID is required' });
    }

    const surveys = await surveyService.getSurveyByGisId(gisId);
    
    // Even if empty, return 200 with empty array (or 404 if user prefers, but findMany returns array)
    res.json({ data: surveys });
  } catch (error) {
    console.error('Error fetching survey by GIS ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
