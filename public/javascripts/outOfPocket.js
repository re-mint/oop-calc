/**
* Calculate Out of Pocket Expenses
*
* @method calculateOutOfPocket
* @param {Object} - persona
* @param {String} - prov
* @return {Number} Out of pocket expenses
*/
function calculateOutOfPocket(persona, prov = "ON") {
  const childCare  = calculateChildCareCost(persona, prov);
  const legalFees  = calculateLegalFees(persona, prov);
  // const mediation  = calcuateMediationFees(persona, prov);
  const transport  = calculateTransportCost(persona, prov);
  const lostIncome = calculateLostIncome(persona, prov);
  const moving     = calculateMovingCost(persona, prov);

  return {
    childCareLawyer   : numeral(childCare.lawyer).format(currencyFormat),
    childCareNoLawyer : numeral(childCare.noLawyer).format(currencyFormat),
    feesLawyer        : numeral(legalFees.lawyer).format(currencyFormat),
    feesNoLawyer      : numeral(legalFees.noLawyer).format(currencyFormat),
    mediation         : numeral(legalFees.mediation).format(currencyFormat),
    transport         : numeral(transport).format(currencyFormat),
    lostIncome        : numeral(lostIncome).format(currencyFormat),
    moving            : numeral(moving).format(currencyFormat)
  };
}

function calculateChildCareDays(persona, prov) {
  if ( !persona.children ) return 0;

  const eventsAtStage = util.findEventsAtStage(prov, persona.stage);
  const prepDaysAtStage = calculatePrepDays(persona, prov);

  return {
    lawyer   : eventsAtStage + prepDaysAtStage.lawyer,
    noLawyer : eventsAtStage + prepDaysAtStage.noLawyer

  }
}

/**
* Calculate the cost of childcare for a persona in a province
*
* @method calculateChildCareCost
* @param {Object} - persona - persona for whom the cost will be calculated
* @param {String} - prov - acronym of province
* @return {Number} Returns number of events at a given stage
*/
function calculateChildCareCost(persona, prov = "ON") {
    const childCount = persona.children || 0;
    const days       = calculateChildCareDays(persona, prov);
    const careCost   = util.getProvData(prov, 'child-care-per-child-per-day') * childCount;

    return {
      lawyer   : days.lawyer * careCost,
      noLawyer : days.noLawyer * careCost
    };
}


/*
  Legal Aid Calculation
  1) Legal aid eligibility (is personal ruled out?)
  2) Do they qualify for legal aid based on number of children and prvovincial salary cutoff
  3) If eligible, OR does not have lawyer, legal fee is 0
  4) Otherwise get legal fee based on stage, adjusted by conflict multipler
*/
function getLegalAidEligibility(persona, prov) {
  //some personas are categorically ruled out
  if ( !persona['legal-aid-eligible'] ) {
    return false;
  }

  //otherwise, check the province's cutoff given number of kids
  const kidString    = persona.children < 2 && `${persona.children}-kids` || '2+-kids';
  const searchString = `legal-aid-eligibility-${kidString}`;
  const cutoff       = util.getProvData(prov, searchString);
  return userInputs.income < cutoff;
}

/**
* Calculate legal fees for a persona in a province
*
* @method calculateLegalFees
* @param {Object} - persona - persona for whom the cost will be calculated
* @param {String} - prov - acronym of province
* @return {Number} Legal fees
*/

/*
  Legal fees with a lawyer:
  Legal fees Court stage legal based on persona court stage
    * Conflict multiplier (in persona sheet)

    UNLESS

    User selected income +
    number of children +
    less than legal aid eligibility # of people per province +

    Professional fees + court fees by stage*/
function calculateLegalFees(persona, prov = "ON") {
    //IF PERSON IS LEGALAID ELGIBLE, LEGAL FEES = 0
    const legalAidMultiple   = getLegalAidEligibility(persona, prov) ? 0 : 1;
    const legalFees          = util.findLegalFeesAtStage(prov, persona.stage);
    const conflictMultiplier = persona.conflict;
    const courtFeesAtStage   = util.findCourtFeesAtStage(prov, persona.stage);
    const profFeesAtStage    = util.findProfessionalFeesAtStage(prov, persona.stage);
    const combinedFees       = courtFeesAtStage + profFeesAtStage;

    //mediation
    const mediationLegalFees = util.findLegalFeesAtStage(prov, 'application');
    const mediationProfFees  = util.findProfessionalFeesAtStage(prov, 'application');
    const mediationCourtFees = util.findCourtFeesAtStage(prov, 'application');
    const mediationFees      = util.getProvData(prov, 'mediation-fees');

    return {
      lawyer    : legalFees * conflictMultiplier * legalAidMultiple + combinedFees,
      noLawyer  : combinedFees,
      mediation : mediationLegalFees * legalAidMultiple + mediationProfFees + mediationCourtFees + mediationFees
    };
}


//Transportation (Court events by stage * Distance from courthouse)
function calculateTransportCost(persona, prov) {
  const eventsAtStage = util.findEventsAtStage(prov, persona.stage);
  const transportCost = util.getProvData(prov, `transport-${userInputs.distance}`);
  return eventsAtStage * transportCost;
}

/*
•	Lost income (
  Employed Y / N + (
    (Court events by stage * Days per appearance) * selected daily income band
  ) + (
    (Court events by stage * Sick Days) * selected daily income band
  )
*/
function calculateLostIncome( persona, prov ) {
  if ( !persona.employed ) return 0;

  const eventsAtStage               = util.findEventsAtStage(prov, persona.stage);
  const income                      = userInputs.income / 242 * persona.employed;
  const daysPerAppearance           = persona['days-off-per-appearance'] + persona['sick-days-per-appearance'];
  const daysperAppearanceWithLawyer = util.adjustForLawyer(daysPerAppearance);
  return eventsAtStage * daysPerAppearance * income;
}


//Caculatae moving cost
function calculateMovingCost(persona, prov) {
  return !!persona.move && util.getProvData(prov, "moving-costs") || 0;
}
