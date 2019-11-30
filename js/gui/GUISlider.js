/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

/* @file
 * The GUISlider class.
 */

class GUISlider extends GUIControl{

  constructor(menu = null, control = null, parent = null, scale = false){
    super(menu, control, parent, scale);

    this.scrollPos = 0.5;
    this.scrollMax = 1;
    this.mouseOffset = {x: 0, y: 0};
    this.value = 0.5;
    this.onValueChanged = undefined;

    if(this.control.HasField('THUMB')){
      this._thumb = this.control.GetFieldByLabel('THUMB').GetChildStructs()[0];
      this.thumbMaterial = new THREE.SpriteMaterial( { map: null, color: 0xffffff } );
      this.thumbMaterial.transparent = true;
      this.thumb = new THREE.Sprite( this.thumbMaterial );
      this.thumb.position.z = 2;
      this.widget.add(this.thumb);
      this.thumb.name = 'SCROLLBAR thumb';
      this.thumb.scale.x = 8;//this.extent.width/2;
      this.thumb.scale.y = 32;//this.extent.height/2;

      let parentPos = this.widget.getWorldPosition(new THREE.Vector3());

      this.thumb.box = new THREE.Box2(
        new THREE.Vector2(
          (parentPos.x - this.extent.width/2),
          (parentPos.y - this.extent.height/2)
        ),
        new THREE.Vector2(
          (parentPos.x + this.extent.width/2),
          (parentPos.y + this.extent.height/2)
        )
      )

      this.thumb.addEventListener('click', (e) => {
        this.mouseInside();
      });

      if(this._thumb.HasField('IMAGE')){
        TextureLoader.enQueue(this._thumb.GetFieldByLabel('IMAGE').GetValue(), this.thumbMaterial, TextureLoader.Type.TEXTURE, () => {
          this.thumbMaterial.transparent = false;
          this.thumbMaterial.alphaTest = 0.5;
          this.thumbMaterial.needsUpdate = true;
        });
        TextureLoader.LoadQueue();
      }
    }

    this.addEventListener('mouseMove', () => {
      this.mouseInside();
    })

    this.addEventListener('click', () =>{
      let mouseX = Mouse.Client.x - (window.innerWidth / 2);

      let scrollLeft = ( this.thumb.position.x + (this.thumb.scale.x / 2) ) + mouseX;
      this.mouseOffset.x = scrollLeft;
      this.mouseInside();
    });

    this.addEventListener('mouseDown', (e) => {
      e.stopPropagation();
      let mouseX = Mouse.Client.x - (window.innerWidth / 2);
      let scrollLeft = ( this.thumb.position.x + (this.thumb.scale.x / 2) ) + mouseX;
      this.mouseOffset.x = scrollLeft;
    });

    this.addEventListener('mouseUp', () => {
      this.mouseInside();
    });

    this.setValue(this.value);

  }

  onINIPropertyAttached(){
    if(this.iniProperty)
      this.setValue(this.iniProperty.value * .01);
  }

  mouseInside(){

    let mouseX = Mouse.Client.x - (window.innerWidth / 2);
    let scrollBarWidth = this.extent.width;
    let threshold = (this.extent.width - 8)/2;
    this.thumb.position.x = (mouseX + 21) + this.extent.width/2;

    if(this.thumb.position.x < -((scrollBarWidth - this.thumb.scale.x))/2 ){
      this.thumb.position.x = -((scrollBarWidth - this.thumb.scale.x))/2
    }

    if(this.thumb.position.x > ((scrollBarWidth - this.thumb.scale.x))/2 ){
      this.thumb.position.x = ((scrollBarWidth - this.thumb.scale.x))/2
    }

    //console.log((this.thumb.position.x + threshold) / threshold);

    let maxScroll = ((scrollBarWidth - this.thumb.scale.x)/2);
    scrollX = (this.thumb.position.x + maxScroll) / (maxScroll*2);
    let valueChanged = (scrollX != this.value);
    this.value = scrollX;

    if(this.iniProperty)
      this.iniProperty.value = parseInt(this.value * 100);

    if(valueChanged && typeof this.onValueChanged === 'function')
      this.onValueChanged(this.value);

  }

  setValue(value = 0){

    this.value = value;
    let maxWidth = (this.extent.width - 8)
    let threshold = maxWidth/2;
    let thumbX = (maxWidth * value) - threshold;
    this.thumb.position.x = thumbX;

    if(this.iniProperty)
      this.iniProperty.value = parseInt(this.value * 100);
    
    if(typeof this.onValueChanged === 'function')
      this.onValueChanged(this.value);

  }

}

module.exports = GUISlider;