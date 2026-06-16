export function buildSymbolicSummary(
  activation: any
) {

  const themes: string[] = [];

  /*
    Pressure
  */

  if (
    activation.prioritySources?.includes(
      "TRANSIT_PRESSURE"
    )
  ) {

    themes.push(
      "active pressure cycle"
    );
  }

  /*
    Support
  */

  if (
    activation.prioritySources?.includes(
      "TRANSIT_SUPPORT"
    )
  ) {

    themes.push(
      "supportive activation"
    );
  }

  /*
    Reinforcement
  */

  if (
    activation.symbolicFlags?.includes(
      "HIGH_REINFORCEMENT"
    )
  ) {

    themes.push(
      "high symbolic reinforcement"
    );
  }

  /*
    Relationship emphasis
  */

  if (
    activation.repeatedStructures?.includes(
      "CONJUNCTION"
    )
  ) {

    themes.push(
      "relationship-oriented patterns"
    );
  }

  /*
    Career / growth emphasis
  */

  if (
    activation.repeatedStructures?.includes(
      "UPACHAYA_LORD"
    )
  ) {

    themes.push(
      "growth through challenge"
    );
  }

  /*
    Spiritual / karmic tension
  */

  if (
    activation.repeatedStructures?.includes(
      "OPPOSITION"
    )
  ) {

    themes.push(
      "internal polarity tension"
    );
  }

  /*
    Stability
  */

  if (
    activation.repeatedStructures?.includes(
      "TRIKONA_LORD"
    )
  ) {

    themes.push(
      "stabilizing intelligence"
    );
  }

  /*
    Output
  */

  return {

    planet:
      activation.planet,

    themes
  };
}