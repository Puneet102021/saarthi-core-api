import {
  calculatePlanetaryPositions
} from "./calculatePlanetaryPositions";

export async function calculateTransitPositions() {

  const now =
    new Date();

  /*
    UTC fractional hour
  */

  const hour =

    now.getUTCHours() +

    (
      now.getUTCMinutes() / 60
    );

  return calculatePlanetaryPositions(

    now.getUTCFullYear(),

    now.getUTCMonth() + 1,

    now.getUTCDate(),

    hour
  );
}