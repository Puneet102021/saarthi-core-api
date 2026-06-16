import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const searchLocations = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const q =
      String(req.query.q || "")
        .trim()
        .toLowerCase();

    if (q.length < 2) {

      res.json([]);

      return;
    }

    const locations =
      await prisma.location.findMany({

        where: {
          searchName: {
            contains: q
          }
        },

        take: 20,

        orderBy: {
          population: "desc"
        },

        select: {
          id: true,
          name: true,
          state: true
        }

      });

    res.json(locations);

  } catch (error) {

    console.error(
      "LOCATION_SEARCH_ERROR",
      error
    );

    res.status(500).json({
      success: false
    });

  }
};