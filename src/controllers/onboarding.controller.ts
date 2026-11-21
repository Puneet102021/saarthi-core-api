import { Response } from "express";

import { prisma } from "../lib/prisma";

import { AuthRequest } from "../middleware/auth.middleware";

import { getUserChart } from "../services/chartService";

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

    /*
      Build the natal chart now so the first question is fast. A failure
      here (bad birth time format, say) must not fail onboarding; the chart
      is rebuilt on first use.
    */
    try {
      await getUserChart(userId);
    } catch (chartError) {
      console.warn(
        "ONBOARDING_CHART_DEFERRED",
        (chartError as Error).message
      );
    }

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
/* The signed-in user's onboarding answers, so the app can route and prefill the profile page. */
export const getOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        onboardingCompleted: true,
        profile: {
          select: {
            fullName: true,
            birthDate: true,
            birthTime: true,
            birthTimeKnown: true,
            birthPlace: true,
            locationId: true,
            primaryFocus: true,
            secondaryFocus: true,
            pressureResponse: true,
            misunderstoodFor: true,
            entryReason: true,
            entryQuestion: true,
            location: { select: { id: true, name: true, state: true } }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const profile = user.profile
      ? { ...user.profile, birthDate: user.profile.birthDate?.toISOString().slice(0, 10) ?? null }
      : null;

    res.json({ success: true, data: { email: user.email, onboardingCompleted: user.onboardingCompleted, profile } });
  } catch (error) {
    console.error("ONBOARDING_GET_ERROR", error);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};
