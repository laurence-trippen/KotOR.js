/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

/* @file
 * The MenuJournal menu class.
 */

class MenuJournal extends GameMenu {
  
  constructor( args = {} ){
    super(args);

    this.background = 'blackfill';

    this.LoadMenu({
      name: 'journal_p',
      onLoad: () => {

        //this.lbl_hint = this.getControlByName('LBL_HINT');

        this.BTN_MESSAGES = this.getControlByName('BTN_MESSAGES');

        this.BTN_MESSAGES.addEventListener('click', (e) => {
          e.stopPropagation();
          Game.MenuMessages.Show();
        });

        if(typeof this.onLoad === 'function')
          this.onLoad();

      }
    })

  }

  Show(){
    super.Show();
    
    Game.MenuActive = true;
    
    Game.InGameOverlay.Hide();
    Game.MenuOptions.Hide();
    Game.MenuCharacter.Hide();
    Game.MenuEquipment.Hide();
    Game.MenuMessages.Hide();
    //Game.MenuJournal.Hide();
    Game.MenuMap.Hide();
    Game.MenuInventory.Hide();
    Game.MenuPartySelection.Hide();
    Game.MenuTop.Show();

  }

}

module.exports = MenuJournal;