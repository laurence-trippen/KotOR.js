/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

/* @file
 * The GUIButton class.
 */

class GUIButton extends GUIControl {
  
  constructor(menu = null, control = null, parent = null, scale = false){
    
    super(menu, control, parent, scale);
    //this.widget.position.z = -2; 
  }

}

module.exports = GUIButton;