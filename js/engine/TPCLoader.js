/* KotOR JS - A remake of the Odyssey Game Engine that powered KotOR I & II
 */

/* @file
 * The THREE.TPCLoader class is used to decode the TPC image format found in the game archives.
 */

const PixelFormat = {
  R8G8B8 : 1,
  B8G8R8 : 2,
  R8G8B8A8 : 3,
  B8G8R8A8 : 4,
  A1R5G5B5 : 5,
  R5G6B5 : 6,
  Depth16 : 7,
  DXT1 : 8,
  DXT3 : 9,
  DXT5 : 10
};

const encodingGray = 0x01;
const encodingRGB = 0x02;
const encodingRGBA = 0x04;
const encodingBGRA = 0x0C;

const TPCHeaderLength = 128;

THREE.TPCLoader = function () {
	this._parser = THREE.TPCLoader.parse;
};

THREE.TPCLoader.prototype = Object.create( THREE.CompressedTextureLoader.prototype );
THREE.TPCLoader.prototype.constructor = THREE.TPCLoader;

THREE.TPCLoader.prototype.loadFromArchive = function ( archive, tex, onComplete = null, onError = null ){
  let resKey = Global.kotorERF[archive].getResourceByKey(tex, ResourceTypes['tpc']);
  if(resKey instanceof Object){

    if (typeof onComplete === 'function') {
      Global.kotorERF[archive].getRawResource(tex, ResourceTypes['tpc'], (buffer) => {
        onComplete(
          new TPCObject({
            filename: tex,
            file: buffer
          })
        );
      });
    }

    return;
  }

  if (typeof onError === 'function') {
    onError('TPC not found in game archive '+archive+'.erf!');
  }

}

THREE.TPCLoader.prototype.findTPC = function ( tex, onComplete = null, onError = null ){

  tex = tex.toLocaleLowerCase();

  let resKey = Global.kotorERF.swpc_tex_gui.getResourceByKey(tex, ResourceTypes['tpc']);
  if(resKey){
    //console.log('GUI', tex, resKey)
    if (typeof onComplete === 'function') {
      Global.kotorERF.swpc_tex_gui.getRawResource(tex, ResourceTypes['tpc'], (buffer) => {
        onComplete(buffer);
      });
    }

    return;
  }

  resKey = Global.kotorERF.swpc_tex_tpa.getResourceByKey(tex, ResourceTypes['tpc']);
  if(resKey){

    if (typeof onComplete === 'function') {
      Global.kotorERF.swpc_tex_tpa.getRawResource(tex, ResourceTypes['tpc'], (buffer) => {
        onComplete(buffer);
      });
    }

    return;
  }

  /*resKey = Global.kotorERF.swpc_tex_tpb.getResourceByKey(tex, ResourceTypes['tpc']);
  if(resKey){

    if (typeof onComplete === 'function') {
      Global.kotorERF.swpc_tex_tpb.getRawResource(resKey, (buffer) => {
        onComplete(buffer);
      });
    }

    return;
  }

  resKey = Global.kotorERF.swpc_tex_tpc.getResourceByKey(tex, ResourceTypes['tpc']);
  if(resKey){

    if (typeof onComplete === 'function') {
      Global.kotorERF.swpc_tex_tpc.getRawResource(resKey, (buffer) => {
        onComplete(buffer);
      });
    }

    return;
  }*/

  //Check in BIF files

  resKey = Global.kotorKEY.GetFileKey(tex, ResourceTypes['tpc']);
  if(resKey){

    if (typeof onComplete === 'function') {
      Global.kotorKEY.GetFileData( resKey, (buffer) => {
        onComplete(buffer);
      });
    }

    return;
  }


  if (typeof onError === 'function') {
    onError('TPC not found in game resources!');
  }

}

THREE.TPCLoader.prototype.fetch = function ( url = '', onLoad = null, onProgress = null, onError = null ) {

	let scope = this;

	if ( Array.isArray( url ) ) {
		let loaded = 0;
		for ( let i = 0, il = url.length; i < il; i++ )
			this.loadTexture(url[i], onLoad = onLoad, onProgress = onProgress, onError = onError);
	} else {
		this.loadTexture(url, onLoad = onLoad, onProgress = onProgress, onError = onError);
	}

	//return this.texture;

};

THREE.TPCLoader.prototype.loadTexture = function(texName, onLoad = null, onProgress = null, onError = null ){
  // compressed cubemap texture stored in a single DDS file
  //console.log('Texture', texName);
  let scope = this;

  this.findTPC(texName, (buffer) => {
    let images = [];
    let texture = new THREE.CompressedTexture();
    texture.txi = null;

    texture.clone = function () {

      let cloned = new this.constructor().copy( this );
    
      cloned.format = this.format;
      cloned.needsUpdate = true;
      cloned.bumpMapType = this.bumpMapType;
      cloned.header = this.header;
      cloned.txi = this.txi;
      return cloned;
    
    }
    

    let tpc = new TPCObject({
      filename: texName,
      file: buffer
    });

    let texDatas = tpc.getDDS( true );

    //console.log('TPCLoader', texName, texDatas);

    texture.name = texName;
    if ( texDatas.isCubemap ) {
      let faces = texDatas.mipmaps.length / texDatas.mipmapCount;
      for ( let f = 0; f < faces; f ++ ) {
        images[ f ] = { mipmaps : [] };
        for ( let i = 0; i < texDatas.mipmapCount; i++ ) {
          images[ f ].mipmaps.push( texDatas.mipmaps[ f * texDatas.mipmapCount + i ] );
          images[ f ].format = texDatas.format;
          images[ f ].width = texDatas.width;
          images[ f ].height = texDatas.height;
        }
      }
      texture.image = images;
      texture.image.width = texDatas.width;
      texture.image.height = texDatas.height;
    } else {
      texture.image.width = texDatas.width;
      texture.image.height = texDatas.height;
      texture.mipmaps = texDatas.mipmaps;
    }

    if ( texDatas.mipmapCount === 1 ) {
      texture.minFilter = THREE.LinearFilter;
    }

    texture.format = texDatas.format;
    texture.needsUpdate = true;
    texture.bumpMapType = 'NORMAL';

    texture.txi = new TXI( tpc.getTXIData() );
    texture.header = tpc.header;
    delete tpc;
    //console.log("loaded texture", texName);

    if ( onLoad ) onLoad( texture );

  }, () => {

    if ( onLoad != null ) onLoad( null );

  });
}

THREE.TPCLoader.prototype.fetch_override = function ( name = '', onLoad = null, onProgress = null, onError = null ) {
  
  var dir = path.join(Config.options.Games.KOTOR.Location, 'Override');
	var scope = this;
	var texture = new THREE.Texture();

	fs.readFile(path.join(dir, name)+'.tpc', (err, buffer) => {
		if (err) throw err; // Fail if the file can't be read.

		let images = [];
    let texture = new THREE.CompressedTexture();
    texture.txi = null;
    texture.name = name;

    let tpc = new TPCObject({
      filename: texName,
      file: buffer
    });

    let texDatas = tpc.getDDS( true );

    //console.log('TPCLoader', texName, texDatas);

    texture.name = texName;
    if ( texDatas.isCubemap ) {
      let faces = texDatas.mipmaps.length / texDatas.mipmapCount;
      for ( let f = 0; f < faces; f ++ ) {
        images[ f ] = { mipmaps : [] };
        for ( let i = 0; i < texDatas.mipmapCount; i++ ) {
          images[ f ].mipmaps.push( texDatas.mipmaps[ f * texDatas.mipmapCount + i ] );
          images[ f ].format = texDatas.format;
          images[ f ].width = texDatas.width;
          images[ f ].height = texDatas.height;
        }
      }
      texture.image = images;
      texture.image.width = texDatas.width;
      texture.image.height = texDatas.height;
    } else {
      texture.image.width = texDatas.width;
      texture.image.height = texDatas.height;
      texture.mipmaps = texDatas.mipmaps;
    }

    if ( texDatas.mipmapCount === 1 ) {
      texture.minFilter = THREE.LinearFilter;
    }

    texture.format = texDatas.format;
    texture.needsUpdate = true;
    texture.bumpMapType = 'NORMAL';

    texture.txi = new TXI( tpc.getTXIData() );
    texture.header = tpc.header;

    //console.log("loaded texture", texName);

    if ( onLoad ) onLoad( texture );

	});

};

THREE.TPCLoader.prototype.load = function ( name, isLocal = false, onLoad = null, onError = null ) {
	if(!isLocal){
		//console.log('Image searching');

    this.findTPC(name, (buffer) => {

      if ( onLoad != null ){
        onLoad(
          new TPCObject({
            filename: name,
            file: buffer
          })
        );
      }

    }, (error) => {
      console.error(error);
    });

	}else{
		console.warning('Local files not implemented yet');
	}
};
