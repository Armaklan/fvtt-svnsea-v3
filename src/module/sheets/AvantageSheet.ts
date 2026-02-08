/**
 * Extends the basic ItemSheet for Avantages.
 */
export class AvantageSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fvtt-svnsea-v3", "sheet", "item", "avantage"],
      template: "systems/fvtt-svnsea-v3/templates/sheets/item-avantage-sheet.hbs",
      width: 520,
      height: 480,
    });
  }

  /** @override */
  getData() {
    const data: any = super.getData();
    data.config = {
      avantageTypes: {
        "passif": "Passif",
        "situationnel": "Situationnel",
        "heroique": "Héroïque",
        "extraordinaire": "Extraordinaire"
      }
    };
    return data;
  }
}
