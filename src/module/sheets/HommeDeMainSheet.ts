import { PlayerCharacterSheet } from './PlayerCharacterSheet';

/**
 * Extends PlayerCharacterSheet for Lieutenant type.
 * A Lieutenant has the same sheet as a player character but only 2 dramatic wounds.
 */
export class HommeDeMainSheet extends PlayerCharacterSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['fvtt-svnsea-v3', 'sheet', 'actor', 'homme-de-main'],
      template: 'systems/fvtt-svnsea-v3/templates/sheets/actor-sheet.hbs',
    });
  }
}
