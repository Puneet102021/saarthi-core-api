export async function buildTimelineKernel(
  dashaData: any
) {

  return {

    mahadasha:
      dashaData.currentMahadasha,

    antardasha:
      dashaData.currentAntardasha,

    currentFocus:
      dashaData.focusArea,

    currentPeriodStart:
      dashaData.startDate,

    currentPeriodEnd:
      dashaData.endDate
  };
}