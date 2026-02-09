/**
 * Extends the basic ActorSheet for Second Couteau type.
 */
export class SecondCouteauSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["fvtt-svnsea-v3", "sheet", "actor", "second-couteau"],
      template: "systems/fvtt-svnsea-v3/templates/sheets/second-couteau-sheet.hbs",
      width: 500,
      height: 300
    });
  }

  /** @override */
  getData() {
    const data: any = super.getData();
    const puissance = data.actor.system.puissance || 1;
    const blessuresValue = data.actor.system.blessures?.value || 0;

    const blessures = [];
    for (let i = 1; i <= puissance; i++) {
      blessures.push({
        index: i,
        filled: blessuresValue >= i
      });
    }
    data.blessures = blessures;

    return data;
  }

  /** @override */
  activateListeners(html: JQuery) {
    super.activateListeners(html);

    // Gestion des cercles de blessures
    html.find('.blessure-circle').click(this._onBlessureClick.bind(this));
  }

  /**
   * Handle clicking on a wound circle
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onBlessureClick(event: JQuery.ClickEvent) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    const currentValue = Number((this.actor as any).system.blessures?.value) || 0;
    
    // Si on clique sur la dernière blessure remplie, on la décoche
    // Sinon on remplit jusqu'à cet index
    const newValue = currentValue === index ? index - 1 : index;

    await this.actor.update({ "system.blessures.value": newValue });
  }
}
