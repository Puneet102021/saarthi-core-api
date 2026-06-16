import { Response } from "express";

import { prisma } from "../lib/prisma";

import { AuthRequest } from "../middleware/auth.middleware";

export const submitOnboarding = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      fullName,
      birthDate,
      birthTime,
      birthTimeKnown,
      locationId,

      primaryFocus,
      secondaryFocus,

      pressureResponse,
      misunderstoodFor,

      entryReason,
      entryQuestion
    } = req.body;

    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
      return;
    }

    const location =
      await prisma.location.findUnique({
        where: {
          id: Number(locationId)
        }
      });

    if (!location) {
      res.status(400).json({
        success: false,
        message: "Invalid location"
      });
      return;
    }

    await prisma.userProfile.upsert({
      where: {
        userId
      },

      update: {
        fullName,

        birthDate:
          birthDate
            ? new Date(birthDate)
            : null,

        birthTime,

        birthTimeKnown,

        birthPlace: location.name,

        locationId: location.id,

        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,

        primaryFocus,
        secondaryFocus,

        pressureResponse,
        misunderstoodFor,

        entryReason,
        entryQuestion
      },

      create: {
        userId,

        fullName,

        birthDate:
          birthDate
            ? new Date(birthDate)
            : null,

        birthTime,

        birthTimeKnown,

        birthPlace: location.name,

        locationId: location.id,

        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,

        primaryFocus,
        secondaryFocus,

        pressureResponse,
        misunderstoodFor,

        entryReason,
        entryQuestion
      }
    });

    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        onboardingCompleted: true
      }
    });

    res.json({
      success: true,
      message: "Onboarding completed"
    });

  } catch (error) {

    console.error(
      "ONBOARDING_ERROR",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to save onboarding"
    });
  }
};