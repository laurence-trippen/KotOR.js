/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

/* @file
 * The CharGenQuickOrCustom menu class.
 */

class CharGenQuickOrCustom extends GameMenu {
  
  constructor( args = {} ){
    super(args);

    this.background = '';

    this.LoadMenu({
      name: 'qorcpnl',
      onLoad: () => {

        this.QUICK_CHAR_BTN = this.getControlByName('QUICK_CHAR_BTN');
        this.CUST_CHAR_BTN = this.getControlByName('CUST_CHAR_BTN');

        this.BTN_BACK = this.getControlByName('BTN_BACK');

        this.QUICK_CHAR_BTN.addEventListener('click', (e) => {
          e.stopPropagation();

          let class_data = Global.kotor2DA['classes'].rows[CharGenClass.SelectedClass];
          let saving_throw_data = Global.kotor2DA[class_data['savingthrowtable'].toLowerCase()].rows[0];
          let feats_table = Global.kotor2DA['feats'].rows;

          Game.player.str = parseInt(class_data.str);
          Game.player.dex = parseInt(class_data.dex);
          Game.player.con = parseInt(class_data.con);
          Game.player.wis = parseInt(class_data.wis);
          Game.player.int = parseInt(class_data.int);
          Game.player.cha = parseInt(class_data.cha);
          Game.player.str = parseInt(class_data.str);

          Game.player.fortbonus = parseInt(saving_throw_data.fortsave);
          Game.player.willbonus = parseInt(saving_throw_data.willsave);
          Game.player.refbonus = parseInt(saving_throw_data.refsave);

          let featstable_key = class_data['featstable'].toLowerCase();

          for(let i = 0, len = feats_table.rows.length; i < len; i++){
            let feat_data = feats_table[i];
            if(feat_data[featstable_key+'_granted'] == 1){
              Game.player.feats.push(i);
            }
          }


          Game.CharGenMain.state = CharGenMain.STATES.QUICK;
          Game.CharGenQuickPanel.Show();
        });

        this.CUST_CHAR_BTN.addEventListener('click', (e) => {
          e.stopPropagation();
          Game.CharGenMain.state = CharGenMain.STATES.CUSTOM;
          Game.CharGenCustomPanel.Show();
        });

        this.BTN_BACK.addEventListener('click', (e) => {
          e.stopPropagation();
          Game.CharGenMain.Hide();

          try{
            Game.player.model.parent.remove(Game.player.model);
          }catch(e){}

          Game.CharGenClass['_3D_MODEL'+(CharGenClass.SelectedClass+1)]._3dView.scene.add(Game.player.model);

          Game.CharGenClass.Show();
        });

        //Hide because this submenu is very incomplete.
        //Comment out this line to work on the custom chargen screen
        this.CUST_CHAR_BTN.hide();

        this.tGuiPanel.offset.x = 138;
        this.tGuiPanel.offset.y = 13;
        this.RecalculatePosition();

        if(typeof this.onLoad === 'function')
          this.onLoad();

      }
    })

  }

  Show(){
    let panelQuickorCustom = Game.CharGenQuickOrCustom.tGuiPanel.getControl();
    Game.scene_gui.remove(panelQuickorCustom);
    Game.scene_gui.add(panelQuickorCustom);

    let panelQuick = Game.CharGenQuickPanel.tGuiPanel.getControl();
    Game.scene_gui.remove(panelQuick);

    let panelCustom = Game.CharGenCustomPanel.tGuiPanel.getControl();
    Game.scene_gui.remove(panelCustom);
  }

  Hide(){

  }

}

module.exports = CharGenQuickOrCustom;