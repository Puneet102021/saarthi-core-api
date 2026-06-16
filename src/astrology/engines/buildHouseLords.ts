import {
  House
} from "../builders/buildHouses";

import {
  PlanetHousePlacement
} from "../builders/mapPlanetsToHouses";

import {
  getSignLord
} from "./buildSignLords";

export interface HouseLord {

  house: number;

  sign: string;

  lord: string;

  lordPlacement: {

    sign: string;

    house: number;
  };
}

export function buildHouseLords(

  houses: House[],

  placements: PlanetHousePlacement[]

): HouseLord[] {

  return houses.map(
    (house) => {

      const lord =
        getSignLord(
          house.sign
        );

      const lordPlacement =
        placements.find(
          (placement) =>
            placement.planet ===
            lord
        );

      if (!lordPlacement) {

        throw new Error(
          `No placement found for lord ${lord}`
        );
      }

      return {

        house:
          house.house,

        sign:
          house.sign,

        lord,

        lordPlacement: {

          sign:
            lordPlacement.sign,

          house:
            lordPlacement.house
        }
      };
    }
  );
}