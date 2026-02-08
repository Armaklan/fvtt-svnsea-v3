/**
 * Extends the basic ActorSheet with specific features for 7Sea V3.
 */
export class PlayerCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["fvtt-svnsea-v3", "sheet", "actor"],
      template: "systems/fvtt-svnsea-v3/templates/sheets/actor-sheet.hbs",
      width: 1000,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
    });
  }

  /** @override */
  getData() {
    const data = super.getData();
    console.log({actorData: data});

    return data;
  }

  /** @override */
  activateListeners(html: JQuery) {
    super.activateListeners(html);

    // Add Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Item
    html.find('.item-delete').click(this._onItemDelete.bind(this));

    // Modification des techniques
    html.find(".technique-item input").change(async (event) => {
      const li = $(event.currentTarget).closest(".technique-item");
      const itemId = li.data("item-id");
      const item = this.actor.items.get(itemId);
      if (!item) return;

      // Récupération des deux champs depuis le <li>
      const name = li.find('input[name="technique-name"]').val();
      const value = Number(li.find('input[name="technique-value"]').val());

      // Mise à jour de l'item
      await item.update({
        name: name,
        "system.value": value
      });
    });

    // Modification des equipements
    html.find(".equipement-item input").change(async (event) => {
      const li = $(event.currentTarget).closest(".equipement-item");
      const itemId = li.data("item-id");
      const item = this.actor.items.get(itemId);
      if (!item) return;

      // Récupération du nom depuis le <li>
      const name = li.find('input[name="equipement-name"]').val();

      // Mise à jour de l'item
      await item.update({
        name: name
      });
    });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onItemCreate(event: JQuery.ClickEvent) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);

    let itemData;
    if (type === "equipements") {
      // For equipements, only include name (no value)
      itemData = {
        name: `New ${typeName}`,
        type: type,
        system: {}
      };
    } else {
      // For other types (technique), include value
      itemData = {
        name: `New ${typeName}`,
        type: type,
        system: { value: 0 }
      };
    }
    await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Handle deleting an Owned Item from the Actor
   * @param {Event} event   The originating click event
   * @private
   */
  private async _onItemDelete(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = $(event.currentTarget).closest(".technique-item, .equipement-item");
    const itemId = element.data("item-id");
    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }
}
