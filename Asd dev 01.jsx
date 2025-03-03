/*
/========================================================================================================================================================

                ---------------------------------------------------------------------------
                Photoshop ASD don't means Action Standard Library
                ---------------------------------------------------------------------------                

    Author: GaragePixel
    Year: 2022
    Version 0.1 - 2022-03-18
    
    Summary:
	Collection of standard functions for Photoshop's Action Script
	This library is no longer actively used now, 
	so I put it online hoping that someone will fork it and continue my work. 
	In particular, more precise control of the timeline remains to be implemented.

========================================================================================================================================================
*/

var Asd = {

    // =======================================================================================================
    // ======================================================================================================= System
    // =======================================================================================================
    
    // ------------------------------------------------------------------------------------------------------------------ CONSTS

    BAYER2X2: 0,
    BAYER4X4: 1,
    BAYER8X8: 2,
    
    // ------------------------------------------------------------------------------------------------------------------ Memory
    
    desc: [],
    ref: [],
    list: [],
 
     flushDesc: function() { 
         this.desc = []
     },
    
     flushRef: function() { 
         this.ref = []
     },
    
     flushList: function() { 
         this.list = []
     },
    
     gc: function() { 
        this.desc = []
        this.ref = []
        this.list = []
    },

    // ------------------------------------------------------------------------------------------------------------------ Getters / Setters
    
    // -------------------------------------------------------- Dialog Mode
    
    dialogMode: DialogModes.NO,    
    
    getDialogMode: function() {
        return this.dialogMode
    },

    setDialogMode: function(bMode) {
        if (bMode) {
            this.dialogMode=DialogModes.ALL
        }else{
            this.dialogMode=DialogModes.NO
        }
    },

    // ------------------------------------------------------------------------------------------------------------------ Aliases (some sugars)
    
     cTID: function(s) { 
         return app.charIDToTypeID(s) 
     },
     
     sTID: function(s) { 
         return app.stringIDToTypeID(s) 
     },
 
     tCID: function(t) { 
         return app.typeIDToCharID(t) 
     }, 

     tSID: function(t) { 
         return app.typeIDToStringID(t) 
     }, 

    // ======================================================================================================= 
    // ======================================================================================================= Document
    // =======================================================================================================     

    hasBackgroundLayer: function() {
        // https://community.adobe.com/t5/photoshop-ecosystem-discussions/get-groupname-with-am/td-p/10068460
        // Return true if the current document has a background layer
        try { (app.activeDocument.backgroundLayer);              
            return true;
        } catch(e) { 
            return false; 
        }
    },

    hasBackground: function() {
        // Sugar for hasBackgroundLayer()
        // Return true if the current document has a background layer
        return this.hasBackgroundLayer()
    },

    getDocLayerItemsLength: function () {
        // https://community.adobe.com/t5/photoshop-ecosystem-discussions/get-groupname-with-am/td-p/10068460
        var ref = new ActionReference();
        ref.putEnumerated(this.cTID("Dcmn"), this.cTID("Ordn"), this.cTID("Trgt"));
        var desc = executeActionGet(ref);
        return desc.getInteger(this.cTID("NmbL"));
    },

    processDocGroupByName: function(name) {//,doThat) {
        // https://community.adobe.com/t5/photoshop-ecosystem-discussions/get-groupname-with-am/td-p/10068460
        var layerCount = this.getLayerNumber();
        var i0 = 0;if (this.hasBackgroundLayer()) { i0 = 1 };
        for (var i = i0; i<=layerCount; i++) {  
           this.ref[i] = new ActionReference();
           this.ref[i].putIndex(this.cTID('Lyr '), i);
           this.desc[0] = executeActionGet(this.ref[i]);
           var layerName = this.desc[0].getString(this.cTID('Nm  '));
           if(layerName == name){
               //doThat();
           }
        }
    },

    getSelectedLayersInfos: function() {
        // https://stackoverflow.com/questions/63774170/get-layer-id-from-photoshop-layer
        // Works with layerSet too (Group)
        // From a selection, return an object with:
        //      layerList[n].id (the id of the layer in n)
        //      layerList[n].idx (the index number of the layer in n)
        //      layerList[n].name (the name of the layer in n)        
        var lyrs = [];
        var lyr;
        this.ref[0] = new ActionReference();
        this.desc[0];
        var tempIndex = 0;
        this.ref[1];
        this.ref[0].putProperty(this.sTID("property"), this.sTID("targetLayers"));
        this.ref[0].putEnumerated(this.cTID('Dcmn'), this.cTID('Ordn'), this.cTID('Trgt'));

        var targetLayers = executeActionGet(this.ref[0]).getList(this.sTID("targetLayers"));
        for (var i = 0; i < targetLayers.count; i++) {
            this.ref[1] = new ActionReference();

          // if there's a background layer in the document, AM indices start with 1, without it from 0.
            try {
                activeDocument.backgroundLayer;
                this.ref[1].putIndex(this.cTID('Lyr '), targetLayers.getReference(i).getIndex());
                this.desc[0] = executeActionGet(this.ref[1]);
                tempIndex = this.desc[0].getInteger(this.sTID("itemIndex")) - 1;
          } catch (o) {
                this.ref[1].putIndex(this.cTID('Lyr '), targetLayers.getReference(i).getIndex() + 1);
                this.desc[0] = executeActionGet(this.ref[1]);
                tempIndex = this.desc[0].getInteger(this.sTID("itemIndex"));
          }

          lyr = {};
          lyr.idx = tempIndex;
          lyr.id = this.desc[0].getInteger(this.sTID("layerID"));
          lyr.name = this.desc[0].getString(this.cTID("Nm  "));
          lyrs.push(lyr);
        }

        return lyrs;
    },

    // ======================================================================================================= 
    // ======================================================================================================= Selection
    // =======================================================================================================    

    deselect: function() {
        // Set Selection to None
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putProperty(this.cTID('Chnl'), this.sTID("selection"));
        desc.putReference(this.cTID('null'), ref);
        desc.putEnumerated(this.cTID('T   '), this.cTID('Ordn'), this.cTID('None'));
        executeAction(this.cTID('setd'), desc, this.dialogMode);
    },

    pasteInPlace: function(enabled) {
        if (enabled != undefined && !enabled) {return}
        var desc = new ActionDescriptor();
        desc.putBoolean(this.sTID("inPlace"), true);
        desc.putEnumerated(this.cTID('AntA'), this.cTID('Annt'), this.cTID('Anno'));
        executeAction(this.cTID('past'), desc, this.dialogMode);
    },

    // ======================================================================================================= 
    // ======================================================================================================= Selection by ID
    // =======================================================================================================    

    getSelectedLayersID: function() {
        // https://stackoverflow.com/questions/63774170/get-layer-id-from-photoshop-layer
        // Get the selected layers' ID (not the idx)
        // Works with layerSet too (Group)
        // From a selection, return an object with:
        //      layerList[n].id (the id of the layer in n)        
        var lyrs = [];
        var lyr;
        this.ref[0] = new ActionReference();
        this.desc[0];
        var tempIndex = 0;
        this.ref[1];
        this.ref[0].putProperty(this.sTID("property"), this.sTID("targetLayers"));
        this.ref[0].putEnumerated(this.cTID('Dcmn'), this.cTID('Ordn'), this.cTID('Trgt'));

        var targetLayers = executeActionGet(this.ref[0]).getList(this.sTID("targetLayers"));
        for (var i = 0; i < targetLayers.count; i++) {
            this.ref[1] = new ActionReference();

          // if there's a background layer in the document, AM indices start with 1, without it from 0.
            try {
                activeDocument.backgroundLayer;
                this.ref[1].putIndex(this.cTID('Lyr '), targetLayers.getReference(i).getIndex());                
            } catch (o) {
                this.ref[1].putIndex(this.cTID('Lyr '), targetLayers.getReference(i).getIndex() + 1);
            }
            this.desc[0] = executeActionGet(this.ref[1]);

            lyr = {};
            lyr.id = this.desc[0].getInteger(this.sTID("layerID"));
            lyrs.push(lyr);         
        }

        return lyrs;
    },

    getId: function() {
        // https://stackoverflow.com/questions/63774170/get-layer-id-from-photoshop-layer
        // Returns the id (idx) of the active layer (must works on a Group too)
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt')); // reference is active layer
        this.desc[0] = executeActionGet(this.ref[0]);
        return this.desc[0].getInteger(this.sTID("layerID"));
    },

    selectByID: function(id, add) {
        // https://stackoverflow.com/questions/63774170/get-layer-id-from-photoshop-layer
        // Select the layer by its id (not the idx)
        if (add == undefined) { add = false };
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putIdentifier(this.cTID('Lyr '), id);
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        if (add) { this.desc[0].putEnumerated(this.sTID("selectionModifier"), this.sTID("selectionModifierType"), this.sTID("addToSelection")) };
        executeAction(this.cTID('slct'), this.desc[0], this.dialogMode);
    },

    selectLayersByID: function(layerId) {
        // Select a layer's group by id (works also with Groups)
        // Sugar of selectByID()
        for (var n=0;n<layerId.length()-1;n++) {
            this.selectByID(layerId[n], true)
        }
    },

    // ======================================================================================================= 
    // ======================================================================================================= Tools
    // =======================================================================================================     

    getTool: function(){  
        // https://forums.adobe.com/thread/579195
        ref = new ActionReference();   
        ref.putEnumerated( this.cTID("capp"), this.cTID("Ordn"), this.cTID("Trgt") );   
        return this.tSID(executeActionGet(ref).getEnumerationType(this.sTID('tool')));      
    },

    setTool: function(tool) {
        // https://www.ps-scripts.com/viewtopic.php?f=68&t=11342&p=152772
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass( this.sTID(tool) );
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        executeAction(this.tSID('slct'), this.desc[0], this.dialogMode);
    },

    // ======================================================================================================= 
    // ======================================================================================================= Layers
    // =======================================================================================================     
    // ------------------------------------------------------------------------------------------------------------------ Layer's features    

    makeLayerBelow: function(targetName) {
        // Make a layer below the target layer
        this.desc[0] = new ActionDescriptor()
        this.ref[0] = new ActionReference()
        this.ref[0].putClass( this.cTID( "Lyr " ) )
        this.desc[0].putReference( this.cTID( "null" ), ref[0] );
        this.desc[0].putBoolean( this.sTID( "below" ), true );
        this.desc[1] = new ActionDescriptor()
        this.desc[1].putString( this.cTID( "Nm  " ), targetName );
        this.desc[0].putObject( this.cTID( "Usng" ), this.cTID( "Lyr " ), desc[1] );
        executeAction( this.cTID( "Mk  " ), this.desc[0], this.dialogModes );
    },

    deleteLayer: function() {
        // Delete current selected layer
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        executeAction(this.cTID('Dlt '), this.desc[0], this.dialogMode);
    },

    rename: function(name) {
         // Rename
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[1].putString(this.cTID('Nm  '), name);
        this.desc[0].putObject(this.cTID('T   '), this.cTID('Lyr '), this.desc[1]);
        executeAction(this.cTID('setd'), this.desc[0], this.dialogMode);
    },

    moveForward: function() {
        // Move Forward
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.ref[1] = new ActionReference();
        this.ref[1].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Nxt '));
        this.desc[0].putReference(this.cTID('T   '), this.ref[1]);
        executeAction(this.cTID('move'), this.desc[0], this.dialogMode);
    },

    moveBackward: function() {
        // Move Backward
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.ref[1] = new ActionReference();
        this.ref[1].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Prvs'));
        this.desc[0].putReference(this.cTID('T   '), this.ref[1]);
        executeAction(this.cTID('move'), this.desc[0], this.dialogMode);
    },
  
    bringToFront: function() {
          // Bring to front
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.ref[1] = new ActionReference();
        this.ref[1].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Frnt'));
        this.desc[0].putReference(this.cTID('T   '), this.ref[1]);
        executeAction(this.cTID('move'), this.desc[0], this.dialogMode);
    },

    bringToBack: function() {
        // Bring to back
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(cTID('null'), this.ref[0]);
        this.ref[1] = new ActionReference();
        this.ref[1].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Back'));
        this.desc[0].putReference(this.cTID('T   '), this.ref[1]);
        executeAction(this.cTID('move'), this.desc[0], this.dialogMode);
    },

    setOpacity: function(n) {
        // Set Opacity
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[1].putUnitDouble(this.cTID('Opct'), this.cTID('#Prc'), n);
        this.desc[0].putObject(this.cTID('T   '), this.cTID('Lyr '), this.desc[1]);
        executeAction(this.cTID('setd'), this.desc[0], this.dialogMode);
    },

    createClippingMask: function() {
        // Create Clipping Mask
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        executeAction(this.sTID('groupEvent'), this.desc[0], this.dialogMode);
    },

    clearArtLayer: function(layer) {
        // Clear any pixels in the ArtLayer
        // This function don't use the Selection (so it can works when a path layer is selected, without deleting the path layer's content)
        // but it's unsafe, the ArtLayer must don't have a Mask Layer because a new one is created then applyed in order to make 
        // all pixels transparently in the layer...
        this.makeLayerMask("hideAll");
        this.applyLayerMask()
    },

    mergeDown: function() {
        var id = this.cTID("Mrg2");
        var desc = new ActionDescriptor();
        executeAction(id, desc, this.dialogMode);
    },

    // ------------------------------------------------------------------------------------------------------------------ Selection in layer's content    
    selectPixels: function() {
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putProperty(this.cTID('Chnl'), this.sTID("selection"));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.ref[1] = new ActionReference();
        this.ref[1].putEnumerated(this.cTID('Chnl'), this.cTID('Chnl'), this.cTID('Trsp'));
        this.desc[0].putReference(this.cTID('T   '), this.ref[1]);
        executeAction(this.cTID('setd'), this.desc[0], this.dialogMode);
    },

    fillSelection: function (tolerance) {
        // Fill the Selection with the Foreground Color
        // tolerance given in purcentage
        if (tolerance == undefined) { tolerance = 100 } // default parameter
        this.desc[0] = new ActionDescriptor();
        this.desc[0].putEnumerated(this.cTID('Usng'), this.cTID('FlCn'), this.cTID('FrgC'));
        this.desc[0].putUnitDouble(this.cTID('Opct'), this.cTID('#Prc'), tolerance);
        this.desc[0].putEnumerated(this.cTID('Md  '), this.cTID('BlnM'), this.cTID('Nrml'));
        executeAction(cTID('Fl  '), this.desc[0], DialogModes.NO);
    },

     // ------------------------------------------------------------------------------------------------------------------ Layer Mask (pixel mask)
    makeMaskFromTransparency: function() {
        // Make a new Mask Using Transparency
        this.desc[0] = new ActionDescriptor();
        this.desc[0].putClass(this.cTID('Nw  '), this.cTID('Chnl'));
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Chnl'), this.cTID('Chnl'), this.cTID('Msk '));
        this.desc[0].putReference(this.cTID('At  '), this.ref[0]);
        this.desc[0].putEnumerated(this.cTID('Usng'), this.cTID('UsrM'), this.cTID('Trns'));
        executeAction(this.cTID('Mk  '), this.desc[0], this.dialogMode);
    },

    deleteLayerMask: function() {
        // Delete the alpha channel of a layer or adjustement layer
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Chnl'), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        executeAction(this.cTID('Dlt '), this.desc[0], this.dialogMode);
    },

    selectLayerMask: function() {
        // Select Alpha Mask
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Chnl'), this.cTID('Chnl'), this.cTID('Msk '));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[0].putBoolean(this.cTID('MkVs'), false);
        executeAction(this.cTID('slct'), this.desc[0], this.dialogMode);
    },

    makeLayerMask: function(mode) {
        // Make Layer Mask
        // https://www.ps-scripts.com/viewtopic.php?f=68&t=11342&p=152772
        // mode :
        //      "hideAll"
        //      "revealAll"
        //      "revealSelection"
        //      "hideSelection"
        //      "fromTransparency"
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.desc[0].putClass(this.sTID("new"), this.sTID("channel"));
        this.ref[0].putEnumerated(this.sTID("channel"), this.sTID("channel"), this.sTID("mask"));
        this.desc[0].putReference(this.sTID("at"), this.ref[0] );
        this.desc[0].putEnumerated(this.sTID("using"), this.cTID("UsrM"), this.sTID(mode)); //revealSelection
        executeAction(this.sTID("make"), this.desc[0], this.dialogMode);
    },

    applyLayerMask: function () {
        // sugar...
        this.applyMask()
    },

    applyMask: function() {
        // Apply the Mask to the current ArtLayer
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Chnl'), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[0].putBoolean(this.cTID('Aply'), true);
        executeAction(this.cTID('Dlt '), this.desc[0], this.dialogMode);
    },

    // ------------------------------------------------------------------------------------------------------------------ Vector Mask (path mask)
    // ------------------------------------------------------------------------------------------------------------------ Lock/unlocks    
    lockArtboardAutonest: function(locked) {
        // Apply Artboard Autonest Locking
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[1].putBoolean(this.sTID("protectArtboardAutonest"), locked);
        this.desc[0].putObject(this.sTID("layerLocking"), this.sTID("layerLocking"), this.desc[1]);
        executeAction(this.sTID('applyLocking'), this.desc[0], this.dialogMode);
    },

    // ======================================================================================================= 
    // ======================================================================================================= Special Layers : Group (layerSet)
    // =======================================================================================================     
    // ------------------------------------------------------------------------------------------------------------------ Group       
    makeGroupFromLayer: function(name) {
        // Make Group from Layer
        // Todo: understand the layerSectionStart-layerSectionEnd
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass(this.sTID("layerSection"));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.ref[1] = new ActionReference();
        this.ref[1].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('From'), this.ref[1]);
        this.desc[1] = new ActionDescriptor();
        this.desc[1].putString(this.cTID('Nm  '), name);
        this.desc[0].putObject(this.cTID('Usng'), this.sTID("layerSection"), this.desc[1]);
//        this.desc[0].putInteger(this.sTID("layerSectionStart"), 387);
//        this.desc[0].putInteger(this.sTID("layerSectionEnd"), 388);
        this.desc[0].putString(this.cTID('Nm  '), name);
        executeAction(this.cTID('Mk  '), this.desc[0], this.dialogMode);
    }, 

    // ======================================================================================================= 
    // ======================================================================================================= Special Layers : Adjustement Layers
    // =======================================================================================================     
    // ------------------------------------------------------------------------------------------------------------------ Adjustement Layer : Curve
    makeAdjLcurve: function() {
        // Make Adjustement Layer: Curve
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass(this.cTID('AdjL'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[2] = new ActionDescriptor();
        this.desc[2].putEnumerated(this.sTID("presetKind"), this.sTID("presetKindType"), this.sTID("presetKindDefault"));
        this.desc[1].putObject(this.cTID('Type'), this.cTID('Crvs'), this.desc[2]);
        this.desc[0].putObject(this.cTID('Usng'), this.cTID('AdjL'), this.desc[1]);
        executeAction(this.cTID('Mk  '), this.desc[0], this.dialogMode);
    },

    makeAdjLcurveRGB: function(values) {
        // Make an adjustment layer curve, RGB curve only
        // values = an array of interleaved x, y coordinates in the range 0-255
        this.makeAdjLcurve()
        this.setAdjLcurveRGB(values)
    },

    setAdjLcurveRGB: function(values) {
        // Set an existing adjustment curve, RGB curve only
        // values = an array of interleaved x, y coordinates in the range 0-255
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('AdjL'), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        //---------------------------------------------------------------------------------------------
        this.desc[1] = new ActionDescriptor();    
        this.list[0] = new ActionList();    
        this.desc[2] = new ActionDescriptor();
        this.ref[1] = new ActionReference();
        this.ref[1].putEnumerated(this.cTID('Chnl'), this.cTID('Chnl'), this.cTID('Cmps'));
        this.desc[2].putReference(this.cTID('Chnl'), this.ref[1]);
        //---------------------------------------------------------------------------------------------    
        this.list[1] = new ActionList();
        //---------------------------------------------------------------------------------------------
        for (var n=0;n<values.length;n+=2) {
            this.desc[3+n] = new ActionDescriptor();
            this.desc[3+n].putDouble(this.cTID('Hrzn'), values[n]);
            this.desc[3+n].putDouble(this.cTID('Vrtc'), values[n+1]);
            this.list[1].putObject(this.cTID('Pnt '), this.desc[3+n]);
        }
        //---------------------------------------------------------------------------------------------    
        this.desc[2].putList(this.cTID('Crv '), this.list[1]);
        this.list[0].putObject(this.cTID('CrvA'), this.desc[2]);
        this.desc[1].putList(this.cTID('Adjs'), this.list[0]);
        this.desc[0].putObject(this.cTID('T   '), this.cTID('Crvs'), this.desc[1]);
        executeAction(this.cTID('setd'), this.desc[0], this.dialogMode);
        this.gc()
    },

    // ------------------------------------------------------------------------------------------------------------------ Adjustement Layer : Inverse

    makeAdjLinvert: function() {
        // Make Adjustement Layer: Invert
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass(this.cTID('AdjL'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[1].putClass(this.cTID('Type'), this.cTID('Invr'));
        this.desc[0].putObject(this.cTID('Usng'), this.cTID('AdjL'), this.desc[1]);
        executeAction(this.cTID('Mk  '), this.desc[0], this.dialogMode);
    },

    // ------------------------------------------------------------------------------------------------------------------ Adjustement Layer : Posterize

    makeAdjLposterize: function(levels) {
        // Make Adjustement Layer: Posterize
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass(this.cTID('AdjL'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[2] = new ActionDescriptor();
        this.desc[2].putInteger(this.cTID('Lvls'), levels);
        this.desc[1].putObject(this.cTID('Type'), this.cTID('Pstr'), this.desc[2]);
        this.desc[0].putObject(this.cTID('Usng'), this.cTID('AdjL'), this.desc[1]);
        executeAction(this.cTID('Mk  '), this.desc[0], this.dialogMode);
    },

    // ------------------------------------------------------------------------------------------------------------------ Adjustement Layer : Gradient Map

    makeAdjLgradientMapDefault: function() {
        // Make Adjustement Layer: Gradient Map (default)
        this.makeAdjLgradientMap2Colors(this.RGB(0,0,0),this.RGB(255,255,255));
    },

    makeAdjLgradientMap2Colors: function(colorA,colorB) {
        // Make Adjustement Layer: Gradient Map (with 2 custom colors)
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass(this.cTID('AdjL'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[2] = new ActionDescriptor();
        this.desc[3] = new ActionDescriptor();
        this.desc[3].putString(this.cTID('Nm  '), "ColorA (shadow) to ColorB (light)");
        this.desc[3].putEnumerated(this.cTID('GrdF'), this.cTID('GrdF'), this.cTID('CstS'));
        this.desc[3].putDouble(this.cTID('Intr'), 4096);
        this.list[0] = new ActionList();
        this.desc[4] = new ActionDescriptor();
        this.desc[5] = new ActionDescriptor();
        this.desc[5].putDouble(this.cTID('Rd  '), colorA.rgb.red);
        this.desc[5].putDouble(this.cTID('Grn '), colorA.rgb.green);
        this.desc[5].putDouble(this.cTID('Bl  '), colorA.rgb.blue);
        this.desc[4].putObject(this.cTID('Clr '), this.sTID("RGBColor"), this.desc[5]);
        this.desc[4].putEnumerated(this.cTID('Type'), this.cTID('Clry'), this.cTID('UsrS'));
        this.desc[4].putInteger(this.cTID('Lctn'), 0);
        this.desc[4].putInteger(this.cTID('Mdpn'), 50);
        this.list[0].putObject(this.cTID('Clrt'), this.desc[4]);
        this.desc[6] = new ActionDescriptor();
        this.desc[7] = new ActionDescriptor();
        this.desc[7].putDouble(this.cTID('Rd  '), colorB.rgb.red);
        this.desc[7].putDouble(this.cTID('Grn '), colorB.rgb.green);
        this.desc[7].putDouble(this.cTID('Bl  '), colorB.rgb.blue);
        this.desc[6].putObject(this.cTID('Clr '), this.sTID("RGBColor"), this.desc[7]);
        this.desc[6].putEnumerated(this.cTID('Type'), this.cTID('Clry'), this.cTID('UsrS'));
        this.desc[6].putInteger(this.cTID('Lctn'), 4096);
        this.desc[6].putInteger(this.cTID('Mdpn'), 50);
        this.list[0].putObject(this.cTID('Clrt'), this.desc[6]);
        this.desc[3].putList(this.cTID('Clrs'), this.list[0]);
        this.list[1] = new ActionList();
        this.desc[8] = new ActionDescriptor();
        this.desc[8].putUnitDouble(this.cTID('Opct'), this.cTID('#Prc'), 100);
        this.desc[8].putInteger(this.cTID('Lctn'), 0);
        this.desc[8].putInteger(this.cTID('Mdpn'), 50);
        this.list[1].putObject(this.cTID('TrnS'), this.desc[8]);
        this.desc[9] = new ActionDescriptor();
        this.desc[9].putUnitDouble(this.cTID('Opct'), this.cTID('#Prc'), 100);
        this.desc[9].putInteger(this.cTID('Lctn'), 4096);
        this.desc[9].putInteger(this.cTID('Mdpn'), 50);
        this.list[1].putObject(this.cTID('TrnS'), this.desc[9]);
        this.desc[3].putList(this.cTID('Trns'), this.list[1]);
        this.desc[2].putObject(this.cTID('Grad'), this.cTID('Grdn'), this.desc[3]);
        this.desc[1].putObject(this.cTID('Type'), this.cTID('GdMp'), this.desc[2]);
        this.desc[0].putObject(this.cTID('Usng'), this.cTID('AdjL'), this.desc[1]);
        executeAction(this.cTID('Mk  '), this.desc[0], this.dialogMode);
//        this.gc()         
    },

    makeAdjLgradientMapAppColors: function() {
        // Make Adjustement Layer: Gradient Map (the 2 colors are taken from the app colors (fore/background colors)
        this.makeAdjLgradientMap2Colors(app.backgroundColor,app.foregroundColor);
    },

    makeAdjLgradientMapSmoothStripe: function(    colorA, colorB, colorSteps,
                                                                            opacityA, opacityB, opacitySteps,        
                                                                            fullRange                                          ) {
        // ------------------------------------------------------------------------------------------------------------------------------------------------------                                                                                
        // Make a Gradient Map composed by a strip of colors and opacities.
        // This function will interpolate the 1st color with the last color, and the 1st opacity with the last opacity for the step indicated number
        // and the "jump" between colors is smooth (each control points of colors are setted with the cMdpn value at 50, passing from one color to another smoothy).
        // If the Mdpn value of the colors and the opacities needs to be setted individualy, makeAdjLgradientMap() must be used instead of this function.
        //
        // The optional parameter "fullRange" says to put the last color at the end of the grade's interval. Usually not needed, this option is typically used
        // for coloring a dithering with a few of steps, the last color seen in the dithering must be at the same value of the end's range of the grade's interval. So, since the position
        // of the color pointers isn't the same than without the parameter activated, the unit's interval between color's steps must be calculated differently.
        // This option is applyed both to the color values and the opacity values.
        //
        // Unlike the most deep version of makeAdjLgradientMap, this function is safe.
        //
        // In:
        //      colorA: the 1st color of the strip (SolidColor)
        //      colorB: the last color of the strip (SolidColor)
        //      colorSteps: the number of color steps (range: 2-100)
        //      opacityA: the 1st color of the strip (SolidColor)
        //      opacityB: the last color of the strip (SolidColor)
        //      opacitySteps: the number of color steps (range: 2-100)
        //      fullRange: true for matching the full grade's range (bool)
        // ------------------------------------------------------------------------------------------------------------------------------------------------------        
        
        this.makeAdjLgradientMapStripe(  colorA, colorB, colorSteps, 50,   opacityA, opacityB, opacitySteps, 50,    fullRange       )
    },

    makeAdjLgradientMapSolidStripe: function(    colorA, colorB, colorSteps,
                                                                        opacityA, opacityB, opacitySteps,       
                                                                        fullRange                                          ) {
        // ------------------------------------------------------------------------------------------------------------------------------------------------------                                                                            
        // Make a Gradient Map composed by a strip of colors and opacities.
        // This function will interpolate the 1st color with the last color, and the 1st opacity with the last opacity for the step indicated number
        // and the "jump" between colors is solid (each control points of colors are setted with the cMdpn value at 95, passing from one color to another hardly).
        // If the Mdpn value of the colors and the opacities needs to be setted individualy, makeAdjLgradientMap() must be used instead of this function.
        //
        // The optional parameter "fullRange" says to put the last color at the end of the grade's interval. Usually not needed, this option is typically used
        // for coloring a dithering with a few of steps, the last color seen in the dithering must be at the same value of the end's range of the grade's interval. So, since the position
        // of the color pointers isn't the same than without the parameter activated, the unit's interval between color's steps must be calculated differently.
        // This option is applyed both to the color values and the opacity values.
        //
        // Unlike the most deep version of makeAdjLgradientMap, this function is safe.
        //
        // In:
        //      colorA: the 1st color of the strip (SolidColor)
        //      colorB: the last color of the strip (SolidColor)
        //      colorSteps: the number of color steps (range: 2-100)
        //      opacityA: the 1st color of the strip (SolidColor)
        //      opacityB: the last color of the strip (SolidColor)
        //      opacitySteps: the number of color steps (range: 2-100)
        //      fullRange: true for matching the full grade's range (bool)
        // ------------------------------------------------------------------------------------------------------------------------------------------------------        
        
        this.makeAdjLgradientMapStripe(  colorA, colorB, colorSteps, 95,   opacityA, opacityB, opacitySteps, 95,    fullRange       )
    },

    makeAdjLgradientMapStripe: function(    colorA, colorB, colorSteps, cMdpn,
                                                                 opacityA, opacityB, opacitySteps, oMdpn,       
                                                                 fullRange                                                         ) {
        // ------------------------------------------------------------------------------------------------------------------------------------------------------
        // Make a Gradient Map composed by a strip of colors and opacities.
        // This function will interpolate the 1st color with the last color, and the 1st opacity with the last opacity for the step indicated number
        // and the "jump" between colors is arbitrary (each control points of colors are setted with the cMdpn value while each control points of opacities are setted with the oMdpn value)
        // If the Mdpn value of the colors and the opacities needs to be setted individualy, makeAdjLgradientMap() must be used instead of this function.
        //
        // The optional parameter "fullRange" says to put the last color at the end of the grade's interval. Usually not needed, this option is typically used
        // for coloring a dithering with a few of steps, the last color seen in the dithering must be at the same value of the end's range of the grade's interval. So, since the position
        // of the color pointers isn't the same than without the parameter activated, the unit's interval between color's steps must be calculated differently.
        // This option is applyed both to the color values and the opacity values.
        //
        // Unlike the most deep version of makeAdjLgradientMap, this function is safe.
        //
        // In:
        //      colorA: the 1st color of the strip (SolidColor)
        //      colorB: the last color of the strip (SolidColor)
        //      colorSteps: the number of color steps (range: 2-100)
        //      cMdpn: the control point's value, the same for all points
        //      opacityA: the 1st color of the strip (SolidColor)
        //      opacityB: the last color of the strip (SolidColor)
        //      opacitySteps: the number of color steps (range: 2-100)
        //      fullRange: true for matching the full grade's range (bool)
        //      oMdpn: the control point's value, the same for all points
        // ------------------------------------------------------------------------------------------------------------------------------------------------------        
        
        var gradientMap = this.getGradientMapStripe(colorA, colorB, colorSteps, cMdpn, opacityA, opacityB, opacitySteps, oMdpn, fullRange)
        this.makeAdjLgradientMap(gradientMap[0],gradientMap[1],gradientMap[2],gradientMap[3],gradientMap[4],gradientMap[5])

    },

    makeAdjLgradientMap: function(colors,cpcts,cMdpn,opacities,opcts,oMdpn) {
        // ------------------------------------------------------------------------------------------------------------------------------------------------------        
        // Make Adjustement Layer: Gradient Map 
        //
        // In:
        //      A set of colors (array) along a set of purcentages (as array too) and a set of cMdpn (array of purcentages)
        //      followed by a set of opacities (array) along a set of purcentages (array) and finally a set of oMdpn (array of purcentages)
        //
        // Notes:
        //      I don't know what's means "Mdpn" but it's the control point controlling the lerp between two points 
        //      given in distance as a purcentage from the first point to the seconds one...
        //      If the Mdpn is setted to 50, it's the default value for any points when the gradient is created within Ps.
        //      Finally, about the Mdpn value, it can't to be more smaller than 5% and more greater than 95% for some reasons. 
        //      It's really important to keep this in mind because they aren't any mecanisms of safety in this function ;
        //      if the programmer put some wrong arguments, Ps may freeze.
        //
        // Exemple usage:
        //      var c=[Asd.RGB(255,0,0),Asd.RGB(0,255,0),Asd.RGB(0,0,225)]  // The set of color points given in solidColors
        //      var cp=[0,50,100]                                                                                    // the position of the points given in purcentage
        //      var cMdpn=[50,50,50]                                                                            // and the mdpn given also in purcentage > 5% && < 95%
        //      var o=[100,100]                                                                                      // The set of opacity points given in purcentage
        //      var op=[0,100]                                                                                        // the position of the points given in purcentage
        //      var oMdpn=[50,50]                                                                                // and the mdpn given also in purcentage > 5% && < 95%
        //      Asd.makeAdjLgradientMap(    c,cp,cMdpn,     o,op,oMdpn      )
        // ------------------------------------------------------------------------------------------------------------------------------------------------------
        
        var n=4,c,cn,cc=0;
        var o,cno;

        // Init Action...
        
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass(this.cTID('AdjL'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[2] = new ActionDescriptor();
        this.desc[3] = new ActionDescriptor();
        this.desc[3].putString(this.cTID('Nm  '), "Arbitrary Grade");
        this.desc[3].putEnumerated(this.cTID('GrdF'), this.cTID('GrdF'), this.cTID('CstS'));
        this.desc[3].putDouble(this.cTID('Intr'), 4096);
        
        // Color values
        
        this.list[0] = new ActionList();        
        for (c=0; c<colors.length*2; c+=2) {
            cn=c+n;
            this.desc[cn] = new ActionDescriptor();
            this.desc[cn+1] = new ActionDescriptor();
            this.desc[cn+1].putDouble(this.cTID('Rd  '), colors[cc].rgb.red);
            this.desc[cn+1].putDouble(this.cTID('Grn '), colors[cc].rgb.green);
            this.desc[cn+1].putDouble(this.cTID('Bl  '), colors[cc].rgb.blue);
            this.desc[cn].putObject(this.cTID('Clr '), this.sTID("RGBColor"), this.desc[cn+1]);
            this.desc[cn].putEnumerated(this.cTID('Type'), this.cTID('Clry'), this.cTID('UsrS'));
            this.desc[cn].putInteger(this.cTID('Lctn'), (0.01*cpcts[cc]*4096));
            this.desc[cn].putInteger(this.cTID('Mdpn'), cMdpn[cc]);
            this.list[0].putObject(this.cTID('Clrt'), this.desc[cn]);        
            cc++;
        }    
        this.desc[3].putList(this.cTID('Clrs'), this.list[0]);        
        
        // Opacity values
        
        this.list[1] = new ActionList();        
        cn+=2
        for (o=0; o<opacities.length; o++) {
            cno=cn+o;            
            this.desc[cno] = new ActionDescriptor();            
            this.desc[cno].putUnitDouble(this.cTID('Opct'), this.cTID('#Prc'),opacities[o]);
            this.desc[cno].putInteger(this.cTID('Lctn'), (0.01*opcts[o]*4096));
            this.desc[cno].putInteger(this.cTID('Mdpn'), oMdpn[o]);
            this.list[1].putObject(this.cTID('TrnS'), this.desc[cno]);
        }
        this.desc[3].putList(this.cTID('Trns'), this.list[1]);

        // Compile Action

        this.desc[2].putObject(this.cTID('Grad'), this.cTID('Grdn'), this.desc[3]);
        this.desc[1].putObject(this.cTID('Type'), this.cTID('GdMp'), this.desc[2]);
        this.desc[0].putObject(this.cTID('Usng'), this.cTID('AdjL'), this.desc[1]);
        executeAction(this.cTID('Mk  '), this.desc[0], this.dialogMode);
        this.gc();
    },

    // ======================================================================================================= 
    // ======================================================================================================= Special Layers : Layers with mask datas
    // =======================================================================================================     
    // ------------------------------------------------------------------------------------------------------------------ Fill / Grade / Pattern Layers
    makePatternLayer: function(name,patternName,linked2layer,blendMode) {
        // old declaration: makePatternLayer: function(name,patternName,patternId,linked2layer,blendMode) {
        // Make Pattern Layer
        // Todo: Add purcentage scaling
        // Todo: Linked to Layer Option (for the moment, setted to ON by default)
        // Args:
        //      Linked2Layer:bool
        //      blendMode: "normal", "colorDodge", "hardMix" and so on...
        
        //linked2layer = (typeof b !== 'undefined') ?  linked2layer : false // Default parameters
        //blendMode = (typeof b !== 'undefined') ?  blendMode : "normal" // Default parameters
        
        // Name: layer's name
        // Pattern's name: an existing pattern
        
        linked2layer=false; // Until I understand why it doesn't words...
        
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass(this.sTID("contentLayer"));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();        
        this.desc[1].putString(this.cTID('Nm  '), name);        
        this.desc[1].putEnumerated(this.cTID('Md  '), this.cTID('BlnM'), this.sTID(blendMode));
        this.desc[1].putBoolean(this.cTID('Grup'), linked2layer);
        this.desc[2] = new ActionDescriptor();
        this.desc[3] = new ActionDescriptor();
        this.desc[3].putString(this.cTID('Nm  '), patternName);
//        this.desc[3].putString(this.cTID('Idnt'), patternId); // the id is not necessary
        this.desc[2].putObject(this.cTID('Ptrn'), this.cTID('Ptrn'), this.desc[3]);
        this.desc[1].putObject(this.cTID('Type'), this.sTID("patternLayer"), this.desc[2]);
        this.desc[0].putObject(this.cTID('Usng'), this.sTID("contentLayer"), this.desc[1]);
        executeAction(this.cTID('Mk  '), this.desc[0], this.dialogMode);
    },       

    // ======================================================================================================= 
    // ======================================================================================================= Special Layers : Layers with extern datas
    // =======================================================================================================     
    // ------------------------------------------------------------------------------------------------------------------ SmartObjects
    // =======================================================================================================     
    // ======================================================================================================= Channel
    // =======================================================================================================     
    // ------------------------------------------------------------------------------------------------------------------ Channels
    selectChannelRGB: function() {
        this.desc[0]  = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated( this.cTID('Chnl'), this.cTID('Chnl'), this.cTID('RGB'));
        this.desc[0].putReference( this.cTID('null'), this.ref[0] );
        executeAction( this.cTID('slct'), this.desc[0], this.dialogMode);
    },

    selectChannelPixels: function(channelName) {
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putProperty(this.cTID('Chnl'), this.sTID("selection"));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.ref[1] = new ActionReference();
        this.ref[1].putName(this.cTID('Chnl'), channelName);
        this.desc[0].putReference(this.cTID('T   '), this.ref[1]);
        executeAction(this.cTID('setd'), this.desc[0], this.dialogMode);
    },
 
     // ======================================================================================================= 
    // ======================================================================================================= Path layers
    // =======================================================================================================     

    // ======================================================================================================= 
    // ======================================================================================================= Blend Modes
    // =======================================================================================================     
    // ------------------------------------------------------------------------------------------------------------------ Blend Modes    
    setBlendModeColorDodge: function() {
        // Set Blend Mode: Color Dodge
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putEnumerated(this.cTID('Lyr '), this.cTID('Ordn'), this.cTID('Trgt'));
        this.desc[0].putReference(this.cTID('null'), this.ref[0]);
        this.desc[1] = new ActionDescriptor();
        this.desc[1].putEnumerated(this.cTID('Md  '), this.cTID('BlnM'), this.cTID('CDdg'));
        this.desc[0].putObject(this.cTID('T   '), this.cTID('Lyr '), this.desc[1]);
        executeAction(this.cTID('setd'), this.desc[0], this.dialogMode);
    },

    // =======================================================================================================     
    // ======================================================================================================= Patterns
    // =======================================================================================================

    hasPattern: function(thisPatternName) {
        try{(this.makePatternLayer("0",thisPatternName,false,"normal"))
            Asd.deleteLayer()
            return true
        }catch(e){            
            return false
        }
    },

    definePattern: function(patternName) {        
        // Define a pattern from a selection in a layer
        var doc = app.activeDocument;
        this.desc[0] = new ActionDescriptor();
        this.ref[0] = new ActionReference();
        this.ref[0].putClass(this.cTID("Ptrn"));
        this.desc[0].putReference( this.cTID("null"), this.ref[0]);
        this.ref[1] = new ActionReference();
        this.ref[1].putProperty(this.cTID("Prpr"), this.cTID("fsel"));
        this.ref[1].putEnumerated(this.cTID("dcmn"), this.cTID("Ordn"), this.cTID("Trgt"));
        this.desc[0].putReference(this.cTID("Usng"), this.ref[1]);
        this.desc[0].putString(this.cTID("Nm  "), patternName);
        executeAction(this.cTID("Mk  "), this.desc[0], this.dialogMode);
    },

    // ======================================================================================================= 
    // ======================================================================================================= Miscs
    // =======================================================================================================     

    // ------------------------------------------------------------------------------------------------------------------ Miscs: Colors
    RGB: function(r,g,b){
        var color = new SolidColor();
        color.rgb.red = r;
        color.rgb.green = g;
        color.rgb.blue = b;
        return color
    },

    GREY: function(v) {
        var c = new SolidColor();
        c.rgb.red = v;
        c.rgb.green = v;
        c.rgb.blue = v;
        return c    
    },

    switchColor: function() {        
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putProperty(this.cTID('Clr '), this.cTID('Clrs'));
        desc.putReference(this.cTID('null'), ref);
        executeAction(this.cTID('Exch'), desc, this.dialogMode);
    },

    // ------------------------------------------------------------------------------------------------------------------ Miscs: Draw
    plotPixel: function(doc,x,y,c) { // c is a SolidColor      
        if (c == undefined) { c = app.foregroundColor }; // default parameter
        doc.selection.select([[x, y],[x + 1, y],[x + 1, y + 1],[x, y + 1],[x, y]], SelectionType.REPLACE);
        doc.selection.fill(c);    
    },

    plotVexel:function(     doc,x,y,
                                      fillColor,
                                      scalex,scaley,
                                      blendMode,opacity,
                                      feather,
                                      preserveTransparency      ) {
        /*
        Vexel, coined by Garage Pixel.
        
        About the usage:
            Since the vexel is a vector bit of image data from a vector field, it uses vector, so Photoshop's path.
            Because of that, plotVexel() can't be used with any path. If you use it for stroke a path with a custom
            bézier's algorithm, the path's point's coordinates sould be copied in an array before the plotting.
        
        In any doubt:
        
            Definition of a Pixel, Voxel, Vexel and Texel:

                Picture (container)
                Pixel (unit = 2 coordinates within a R2 euclidian field)
                
               Texture (container)
               Texel (unit = 2 coordinates within a unit intervale [0-1] of a R2 euclidian field)
               
               Volume = 3d texture (container)
               Voxel (unit = 3 coordinates within a R3 euclidan field)
                
               Vector field (container)
               Vexel (unit = 2 coordinates in a R2 vector field)

           To understand the original, immediatly understandable meaning of Vexel:

                The vexel is the most little unite of a vector field, a bit of a grid. Unlike the pixel, the vexel is not defined by one coordinate but four, like the rectangle at
                its data level. But like the pixel, only two coordinates are used for its localization within its field, at its representation level.
                Because the voxel is relative to its parent field, it can be scaled or encoded in a unit interval of a top-level rectangle as the field, like the texel.
                So it's important to understand that the vexel is organically linked to the already well-know properties of the pixel and the texel.
           
                The vexel don't represente the entire rasterized image, it's a unit and it's the only way to draw faster the pixels in Photoshop via ActionScript, 
                more faster than the actually most used approach selectionFilled-based. The vexel is also a really fast approach to draw pixel art with modern game engines.
                Nearly all the pixel art games made after 2010, especially for html5/canvas, are composed of vexels. The vexels provide a non-native way to plot pixels
                on the surface of the modern gfx API like DirectX, OpenGL and Vulkan. About the other games, its writes in a texture surface, so uses the texel.            
                Vexel exists as an concept, as a encoding data method, a drawing technique and a set of properties. It's not an art unlike the pixel art, 
                if vexel should be a rasterized vector art, it should by called rasterized vector art, so nobody should have to explain why a rasterized form of something is called by something other. 
                We should eliminate any words we don't need for thinking about something and fight any dogmatic colleges and churches that's provides wrong ideas and concepts,
                trows peoples in errors and owns some domain names around their words in order to protect their mercantile operations.
                
                Shortly:
                
                Rasterized texture != texel
                Rasterized vector art != vexel
                
                Pixel = unit U picture (pic field)
                Texel = unit U texture (tec field)
                Vexel = unit U vector field (vec field)
                
                Like any words used in the scientific domain, Garage Pixel don't have coined the word, he give its own meaning but don't take it over its owner.
                About any neologism; not understandable immediatly, even used by million of peoples, is called a trademark and, usually, as also an owned web domain name.
                The universalism of a neologism makes it immediatly understandable by anyone in the world, because expected, natural, reasonable and following the rules of the langage .
                We need to use this word in some IT domains without any confusion, freely, with a common and consensual specification.
                
                Enough about the meaning, here an easy way to plot a pixel encoded by a vexel, very similar than when we plot a pixel encoded by a texel:
       
        */   

        // Default parameters
        if (fillColor == undefined) { fillColor = app.foregroundColor };
        if (scalex == undefined) { scalex = 1 };
        if (scaley == undefined) { scaley = 1 };
        if (blendMode == undefined) { blendMode = ColorBlendMode.NORMAL };
        if (opacity == undefined) { opacity = 100 };        
        if (feather == undefined) { feather = 0 };
        if (preserveTransparency == undefined) { preserveTransparency = false };    

        // Define the vexel 
        var pathInfs = new Array(); 

        // Vexel's top left
        ptsInfs[0] = new PathPointInfo; 
        ptsInfs[0].kind = PointKind.CORNERPOINT; 
        ptsInfs[0].anchor = Array(x, y);//top left 
        ptsInfs[0].leftDirection = lineArray[0].anchor; 
        ptsInfs[0].rightDirection = lineArray[0].anchor; 

        // Vexel's top right
        ptsInfs[1] = new PathPointInfo; 
        ptsInfs[1].kind = PointKind.CORNERPOINT; 
        ptsInfs[1].anchor = Array(x*scalex, y);//top right 
        ptsInfs[1].leftDirection = lineArray[1].anchor; 
        ptsInfs[1].rightDirection = lineArray[1].anchor; 

        // Vexel's bottom right
        ptsInfs[2] = new PathPointInfo; 
        ptsInfs[2].kind = PointKind.CORNERPOINT; 
        ptsInfs[2].anchor = Array(x*scalex, y*scaley);//bottom right 
        ptsInfs[2].leftDirection = lineArray[2].anchor; 
        ptsInfs[2].rightDirection = lineArray[2].anchor; 

        // Vexel's bottom left
        ptsInfs[3] = new PathPointInfo; 
        ptsInfs[3].kind = PointKind.CORNERPOINT; 
        ptsInfs[3].anchor = Array(x, y*scaley);//bottom left 
        ptsInfs[3].leftDirection = lineArray[3].anchor; 
        ptsInfs[3].rightDirection = lineArray[3].anchor; 

        // Vexel's shape
        var subPathInfs = new Array(); 
        subPathInfs[0] = new SubPathInfo(); 
        subPathInfs[0].operation = ShapeOperation.SHAPEADD; 
        subPathInfs[0].closed = true; 
        subPathInfs[0].entireSubPath = ptsInfs; 

        // Make the vexel
        var myVexel = doc.pathItems.add("Vexel tmp", subPathInfs); 

        // Fill the vexel (rasterize the vexel)
        myVoxel.fillPath(fillColor,blendMode,opacity,preserveTransparency,feather,false,false);   

        // Remove the vexel 
        myVoxel.remove();

    },

    // ------------------------------------------------------------------------------------------------------------------ Miscs: GradientMapStripe
        getGradientMapStripe: function(      colorA, colorB, colorSteps, cMdpn,
                                                              opacityA, opacityB, opacitySteps, oMdpn,       
                                                              fullRange                                                         ) {
        // ------------------------------------------------------------------------------------------------------------------------------------------------------
        // Make a Gradient Map composed by a strip of colors and opacities.
        // This function will interpolate the 1st color with the last color, and the 1st opacity with the last opacity for the step indicated number
        // and the "jump" between colors is arbitrary (each control points of colors are setted with the cMdpn value while each control points of opacities are setted with the oMdpn value)
        // If the Mdpn value of the colors and the opacities needs to be setted individualy, makeAdjLgradientMap() must be used instead of this function.
        //
        // The optional parameter "fullRange" says to put the last color at the end of the grade's interval. Usually not needed, this option is typically used
        // for coloring a dithering with a few of steps, the last color seen in the dithering must be at the same value of the end's range of the grade's interval. So, since the position
        // of the color pointers isn't the same than without the parameter activated, the unit's interval between color's steps must be calculated differently.
        // This option is applyed both to the color values and the opacity values.
        //
        // getGradientMapStripe can be used for making a stripe for any gradient in Photoshop.
        //
        // This function is safe.
        //
        // In:
        //      colorA: the 1st color of the strip (SolidColor)
        //      colorB: the last color of the strip (SolidColor)
        //      colorSteps: the number of color steps (range: 2-100)
        //      cMdpn: the control point's value, the same for all points
        //      opacityA: the 1st color of the strip (SolidColor)
        //      opacityB: the last color of the strip (SolidColor)
        //      opacitySteps: the number of color steps (range: 2-100)
        //      fullRange: true for matching the full grade's range (bool)
        //      oMdpn: the control point's value, the same for all points
        //
        // Out:
        //
        //      result:Array
        //          result[0] (the color datas)
        //          result[1] (the cpct datas)
        //          result[2] (the cMdpn datas)
        //          result[3] (the opacity datas)
        //          result[4] (the opct datas)
        //          result[5] (the oMdpn datas)        
        // ------------------------------------------------------------------------------------------------------------------------------------------------------        

        if (fullRange == undefined) { fullRange = false } // default parameter
        if (colorSteps < 2) { colorSteps = 2 } // default parameter
        if (colorSteps > 100) { colorSteps = 100 } // default parameter
        if (cMdpn < 5) { cMdpn = 5 } // default parameter
        if (cMdpn > 95) { cMdpn = 95 } // default parameter        
        if (opacitySteps < 2) { opacitySteps = 2 } // default parameter
        if (opacitySteps > 100) { opacitySteps = 100 } // default parameter        
        if (oMdpn < 5) { oMdpn = 5 } // default parameter        
        if (oMdpn > 95) { oMdpn = 95 } // default parameter

        var result = [];
        var colors = [],cpcts = [],cMdpns = [];
        var opacities = [],opcts = [],oMdpns = [];        
        
        var lp=0;
        if (colorSteps == 2) {
            colors.push(colorA)
            colors.push(colorB)
            cpcts.push(0)
            if (fullRange) {
                cpcts.push(100)
            } else {
                cpcts.push(50)
            }
            cMdpns.push(cMdpn)
            cMdpns.push(cMdpn)
        } else {
            var color;            
            var unitR = (colorB.rgb.red - colorA.rgb.red)/(colorSteps-1);
            var unitG = (colorB.rgb.green - colorA.rgb.green)/(colorSteps-1);
            var unitB = (colorB.rgb.blue - colorA.rgb.blue)/(colorSteps-1);            
            if (fullRange) {
                var unitC = 100/(colorSteps-1);
                var QunitC=0;
                lp=0;
            } else {
                var unitC = 100/colorSteps;
                var QunitC = unitC/(colorSteps-1);
                lp=1;
            }
            var i=1;for (var n=0; n < unitC*(colorSteps-lp); n+=unitC) {
                color = new SolidColor()
                color.rgb.red = colorA.rgb.red+(unitR*(i-1))+QunitC;
                color.rgb.green = colorA.rgb.green+(unitG*(i-1))+QunitC;
                color.rgb.blue = colorA.rgb.blue+(unitB*(i-1))+QunitC;
                colors.push(color)
                cpcts.push(n)   
                cMdpns.push(cMdpn)
                i++;            
            }       
            if (!fullRange) {
                colors.push(colorB)
                cpcts.push(100-unitC)
                cMdpns.push(cMdpn)
            }
        }
        if (opacitySteps == 2) {
                opacities.push(opacityA)
                opcts.push(0)
                oMdpns.push(oMdpn)
                opacities.push(opacityB)
                if (fullRange) {
                    opcts.push(100)
                } else {
                    opcts.push(50)
                }
                oMdpns.push(oMdpn)                
                oMdpns.push(oMdpn)
        } else {
            if (fullRange) {
                var unitA = 100/(opacitySteps-1);
                var QunitA = 0;
                lp=0;
            } else {
                var unitA = 100/opacitySteps;
                var QunitA = unitA/(opacitySteps-1);
                lp=1;
            }
            i=1;for (var n=0; n < unitA*(opacitySteps-lp); n+=unitA) {            
                opacities.push(opacityA+(unitA*(i-1))+QunitA)
                opcts.push(n)
                oMdpns.push(oMdpn)
                i++;
            }
            if (!fullRange) {
                opacities.push(opacityB)
                opcts.push(100-unitA)
                oMdpns.push(oMdpn)            
            }
        }        
        
        result.push(colors)
        result.push(cpcts)
        result.push(cMdpns)
        result.push(opacities)
        result.push(opcts)
        result.push(oMdpns)        
        
        return result;

    },

    // ------------------------------------------------------------------------------------------------------------------ Miscs: Patterns in Library

    addInLibPatternIfNotExist: function(patternName) {
        switch (patternName) {
            case "BayerMtx2x2":
                Asd.addBayerMtx2x2ifNotExist()
                break;
            case "BayerMtx4x4":
                Asd.addBayerMtx4x4ifNotExist()
                break;
            case "BayerMtx8x8":
                Asd.addBayerMtx8x8ifNotExist()
                break;
        }      
    },

    // ------------------------------------------------------------------------------------------------------------------ Miscs: Bayer Matrix and other patterns
    hasBayerMtx2x2: function() {        
        if (this.hasPattern("BayerMtx2x2")) {
            return true
        }else{
            return false
        }
    },

    hasBayerMtx4x4: function() {        
        if (this.hasPattern("BayerMtx4x4")) {
            return true
        }else{
            return false
        }
    },

    hasBayerMtx8x8: function() {        
        if (this.hasPattern("BayerMtx8x8")) {
            return true
        }else{
            return false
        }
    },

    addBayerMtx2x2ifNotExist: function() {        
        if (!this.hasPattern("BayerMtx2x2")) {
            this.addBayerMtx(this.BAYER2X2)
        }
    },

    addBayerMtx4x4ifNotExist: function() {        
        if (!this.hasPattern("BayerMtx4x4")) {
            this.addBayerMtx(this.BAYER4X4)
        }
    },

    addBayerMtx8x8ifNotExist: function() {        
        if (!this.hasPattern("BayerMtx8x8")) {
            this.addBayerMtx(this.BAYER8X8)
        }
    },

    addBayerMtx: function(bayerType) {
        // Create/recreate our beloved "halftone-like square pattern" (as Adobe said)
        // and store it as a pattern called BayerMtx2x2, BayerMtx4x4 or BayerMtx8x8
        // BayerType:
        //      this.BAYER2X2
        //      this.BAYER4X4
        //      this.BAYER8X8
        var oldRulerUnits = app.preferences.rulerUnits;
        var oldTypeUnits = app.preferences.typeUnits;
        var oldDisplayDialogs = app.displayDialogs;  
        app.preferences.rulerUnits = Units.PIXELS;
        app.preferences.typeUnits = TypeUnits.PIXELS;
        app.displayDialogs = DialogModes.NO;        
        var checkersDoc = app.documents.add(8, 8, 72, "DitherMtx");
        var doc = app.activeDocument;             
        var mtxName;        
        switch(bayerType) {
            case this.BAYER2X2:
                this.drawBayerMtx2x2(doc,0,0);
                mtxName="BayerMtx2x2"
                doc.selection.select([[0, 0],[2, 0],[2, 2],[0, 2],[0, 0]], SelectionType.EXTEND);
                break;
            case this.BAYER8X8:
                this.drawBayerMtx8x8(doc,0,0);
                mtxName="BayerMtx8x8"
                doc.selection.select([[0, 0],[8, 0],[8, 8],[0, 8],[0, 0]], SelectionType.EXTEND);
                break;
            default:
                this.drawBayerMtx4x4(doc,0,0);
                mtxName="BayerMtx4x4"
                doc.selection.select([[0, 0],[4, 0],[4, 4],[0, 4],[0, 0]], SelectionType.EXTEND);
        }        
        this.definePattern(mtxName)
        doc.close(SaveOptions.DONOTSAVECHANGES)        
        app.preferences.rulerUnits = oldRulerUnits;
        app.preferences.typeUnits = oldTypeUnits;
        app.displayDialogs = oldDisplayDialogs;
    },

    drawBayerMtx2x2: function(doc,x,y) {        
        // From this picture:
        // https://wikimedia.org/api/rest_v1/media/math/render/svg/90fffe8dda4a6cf319ba15ae5e3f6c4b24ab99da
        // Then each values are multiplicated by 63.75 (because 255/2²) then rounded to the floor    
        var d=63.75;
        this.plotPixel(doc,x+0,y+0,this.GREY(Math.floor(0.0*d)));this.plotPixel(doc,x+1,y+0,this.GREY(Math.floor(2.0*d)));
        this.plotPixel(doc,x+0,y+1,this.GREY(Math.floor(3.0*d)));this.plotPixel(doc,x+1,y+1,this.GREY(Math.floor(1.0*d)));
    },

    drawBayerMtx4x4: function (doc,x,y) {        
        // From this picture:
        // https://wikimedia.org/api/rest_v1/media/math/render/svg/3c62838dbbd378c058444a60b9c803b9bb4ee09c
        // Then each values are multiplicated by 15.9375 (because 255/4²) then rounded to the floor
        var d=15.9375;
        this.plotPixel(doc,x+0,y+0,this.GREY(Math.floor(0.0*d)));     this.plotPixel(doc,x+1,y+0,this.GREY(Math.floor(8.0*d)));     this.plotPixel(doc,x+2,y+0,this.GREY(Math.floor(2.0*d)));     this.plotPixel(doc,x+3,y+0,this.GREY(Math.floor(10.0*d)));
        this.plotPixel(doc,x+0,y+1,this.GREY(Math.floor(12.0*d)));   this.plotPixel(doc,x+1,y+1,this.GREY(Math.floor(4.0*d)));     this.plotPixel(doc,x+2,y+1,this.GREY(Math.floor(14.0*d)));   this.plotPixel(doc,x+3,y+1,this.GREY(Math.floor(6.0*d)));
        this.plotPixel(doc,x+0,y+2,this.GREY(Math.floor(3.0*d)));     this.plotPixel(doc,x+1,y+2,this.GREY(Math.floor(11.0*d)));   this.plotPixel(doc,x+2,y+2,this.GREY(Math.floor(1.0*d)));     this.plotPixel(doc,x+3,y+2,this.GREY(Math.floor(9.0*d)));
        this.plotPixel(doc,x+0,y+3,this.GREY(Math.floor(15.0*d)));   this.plotPixel(doc,x+1,y+3,this.GREY(Math.floor(7.0*d)));     this.plotPixel(doc,x+2,y+3,this.GREY(Math.floor(13.0*d)));   this.plotPixel(doc,x+3,y+3,this.GREY(Math.floor(5.0*d)));
    },

    drawBayerMtx8x8: function(doc,x,y) {        
        // From this picture:
        // https://wikimedia.org/api/rest_v1/media/math/render/svg/1faa7b6acd35182fcf8954d14f721260e5b7f422
        // Then each values are multiplicated by 3.984375 (because 255/8²) then rounded to the floor
        var d=3.984375;
        this.plotPixel(doc,x+0,y+0,this.GREY(Math.floor(0.0*d)));     this.plotPixel(doc,x+1,y+0,this.GREY(Math.floor(32.0*d)));     this.plotPixel(doc,x+2,y+0,this.GREY(Math.floor(8.0*d)));     this.plotPixel(doc,x+3,y+0,this.GREY(Math.floor(40.0*d)));    this.plotPixel(doc,x+4,y+0,this.GREY(Math.floor(2.0*d)));     this.plotPixel(doc,x+5,y+0,this.GREY(Math.floor(34.0*d)));   this.plotPixel(doc,x+6,y+0,this.GREY(Math.floor(10.0*d)));   this.plotPixel(doc,x+7,y+0,this.GREY(Math.floor(42.0*d)));
        this.plotPixel(doc,x+0,y+1,this.GREY(Math.floor(48.0*d)));   this.plotPixel(doc,x+1,y+1,this.GREY(Math.floor(16.0*d)));     this.plotPixel(doc,x+2,y+1,this.GREY(Math.floor(56.0*d)));   this.plotPixel(doc,x+3,y+1,this.GREY(Math.floor(24.0*d)));    this.plotPixel(doc,x+4,y+1,this.GREY(Math.floor(50.0*d)));   this.plotPixel(doc,x+5,y+1,this.GREY(Math.floor(18.0*d)));    this.plotPixel(doc,x+6,y+1,this.GREY(Math.floor(58.0*d)));   this.plotPixel(doc,x+7,y+1,this.GREY(Math.floor(26.0*d)));    
        this.plotPixel(doc,x+0,y+2,this.GREY(Math.floor(12.0*d)));   this.plotPixel(doc,x+1,y+2,this.GREY(Math.floor(44.0*d)));     this.plotPixel(doc,x+2,y+2,this.GREY(Math.floor(4.0*d)));     this.plotPixel(doc,x+3,y+2,this.GREY(Math.floor(36.0*d)));    this.plotPixel(doc,x+4,y+2,this.GREY(Math.floor(14.0*d)));   this.plotPixel(doc,x+5,y+2,this.GREY(Math.floor(46.0*d)));    this.plotPixel(doc,x+6,y+2,this.GREY(Math.floor(6.0*d)));     this.plotPixel(doc,x+7,y+2,this.GREY(Math.floor(38.0*d)));
        this.plotPixel(doc,x+0,y+3,this.GREY(Math.floor(60.0*d)));   this.plotPixel(doc,x+1,y+3,this.GREY(Math.floor(28.0*d)));     this.plotPixel(doc,x+2,y+3,this.GREY(Math.floor(52.0*d)));   this.plotPixel(doc,x+3,y+3,this.GREY(Math.floor(20.0*d)));    this.plotPixel(doc,x+4,y+3,this.GREY(Math.floor(62.0*d)));   this.plotPixel(doc,x+5,y+3,this.GREY(Math.floor(30.0*d)));    this.plotPixel(doc,x+6,y+3,this.GREY(Math.floor(54.0*d)));   this.plotPixel(doc,x+7,y+3,this.GREY(Math.floor(22.0*d)));
        this.plotPixel(doc,x+0,y+4,this.GREY(Math.floor(3.0*d)));     this.plotPixel(doc,x+1,y+4,this.GREY(Math.floor(35.0*d)));     this.plotPixel(doc,x+2,y+4,this.GREY(Math.floor(11.0*d)));   this.plotPixel(doc,x+3,y+4,this.GREY(Math.floor(43.0*d)));    this.plotPixel(doc,x+4,y+4,this.GREY(Math.floor(1.0*d)));     this.plotPixel(doc,x+5,y+4,this.GREY(Math.floor(33.0*d)));   this.plotPixel(doc,x+6,y+4,this.GREY(Math.floor(9.0*d)));      this.plotPixel(doc,x+7,y+4,this.GREY(Math.floor(41.0*d)));
        this.plotPixel(doc,x+0,y+5,this.GREY(Math.floor(51.0*d)));   this.plotPixel(doc,x+1,y+5,this.GREY(Math.floor(19.0*d)));     this.plotPixel(doc,x+2,y+5,this.GREY(Math.floor(59.0*d)));   this.plotPixel(doc,x+3,y+5,this.GREY(Math.floor(27.0*d)));    this.plotPixel(doc,x+4,y+5,this.GREY(Math.floor(49.0*d)));   this.plotPixel(doc,x+5,y+5,this.GREY(Math.floor(17.0*d)));    this.plotPixel(doc,x+6,y+5,this.GREY(Math.floor(57.0*d)));   this.plotPixel(doc,x+7,y+5,this.GREY(Math.floor(25.0*d)));
        this.plotPixel(doc,x+0,y+6,this.GREY(Math.floor(15.0*d)));   this.plotPixel(doc,x+1,y+6,this.GREY(Math.floor(47.0*d)));     this.plotPixel(doc,x+2,y+6,this.GREY(Math.floor(7.0*d)));     this.plotPixel(doc,x+3,y+6,this.GREY(Math.floor(39.0*d)));    this.plotPixel(doc,x+4,y+6,this.GREY(Math.floor(13.0*d)));   this.plotPixel(doc,x+5,y+6,this.GREY(Math.floor(45.0*d)));    this.plotPixel(doc,x+6,y+6,this.GREY(Math.floor(5.0*d)));     this.plotPixel(doc,x+7,y+6,this.GREY(Math.floor(37.0*d)));
        this.plotPixel(doc,x+0,y+7,this.GREY(Math.floor(63.0*d)));   this.plotPixel(doc,x+1,y+7,this.GREY(Math.floor(31.0*d)));     this.plotPixel(doc,x+2,y+7,this.GREY(Math.floor(55.0*d)));   this.plotPixel(doc,x+3,y+7,this.GREY(Math.floor(23.0*d)));    this.plotPixel(doc,x+4,y+7,this.GREY(Math.floor(61.0*d)));   this.plotPixel(doc,x+5,y+7,this.GREY(Math.floor(29.0*d)));    this.plotPixel(doc,x+6,y+7,this.GREY(Math.floor(53.0*d)));   this.plotPixel(doc,x+7,y+7,this.GREY(Math.floor(21.0*d)));
    },

    // ------------------------------------------------------------------------------------------------------------------ Miscs: String
    left: function(str, chr) {
        // https://seegatesite.com/how-to-use-right-and-left-function-in-javascript/
        // Fix added : the 1st line avoid the xml's comment CDATA as a result
        if (chr == str.length) return str
        if (chr > str.length) return str
        return str.slice(0, chr - str.length);
    },
    
    right: function(str, chr) {
        // https://seegatesite.com/how-to-use-right-and-left-function-in-javascript/    
        return str.slice(str.length-chr,str.length);
    },    
    
    invStr: function(str) {
        return str.split(/(?:)/).reverse().join('');
    },
    
    print: function(str) {
        $.writeln(str)
    },

}