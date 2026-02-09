/**
 * Extends the basic ItemSheet for Pouvoirs.
 */
export class PouvoirSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["fvtt-svnsea-v3", "sheet", "item", "pouvoir"],
      template: "systems/fvtt-svnsea-v3/templates/sheets/item-pouvoir-sheet.hbs",
      width: 600,
      height: 480,
    });
  }

  /** @override */
  getData() {
    const data: any = super.getData();
    return data;
  }
}
