import fs from "fs";
import path from "path";
// @ts-ignore
import csv from "csv-parser";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const locations: any[] = [];

const filePath = path.join(
  process.cwd(),
  "clean_india_locations.csv"
);

fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (row: any) => {

    locations.push({
      name: row.name?.trim(),
      state: row.state?.trim(),

      latitude: Number(row.latitude),
      longitude: Number(row.longitude),

      population: row.population
        ? Number(row.population)
        : null,

      timezone: row.timezone?.trim(),

      searchName:
        row.search_name?.trim() ||
        row.searchName?.trim() ||
        row.name?.toLowerCase()
    });

  })
  .on("end", async () => {

    try {

      console.log(
        `Importing ${locations.length} locations`
      );

      await prisma.location.createMany({
        data: locations
      });

      console.log(
        "Location import completed successfully"
      );

    } catch (error) {

      console.error(
        "IMPORT ERROR",
        error
      );

    } finally {

      await prisma.$disconnect();

    }

  });