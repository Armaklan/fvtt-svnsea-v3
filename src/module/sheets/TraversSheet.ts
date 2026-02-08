/**
 * Extends the basic ItemSheet for Travers.
 */
export class TraversSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fvtt-svnsea-v3", "sheet", "item", "travers"],
      template: "systems/fvtt-svnsea-v3/templates/sheets/item-travers-sheet.hbs",
      width: 520,
      height: 480,
    });
  }

  /** @override */
  getData() {
    const data: any = super.getData();
    return data;
  }
}
