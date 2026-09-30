(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCharacterBindingRegistry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const REGISTRY=Object.freeze({
    schema:'TAKY_UI_BINDING_CONTRACT_V1',
    app_id:'HIDE_SEEK',
    slots:Object.freeze([
  {
    "slot_id": "partner-primary",
    "surface": "#partnerBar/#partnerAvatar/#partnerName/#partnerText",
    "allowed_presence_roles": [
      "MAIN",
      "CHAPTER_OWNER"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  },
  {
    "slot_id": "scene-companion",
    "surface": "#view character slot when screen contract allows",
    "allowed_presence_roles": [
      "GUEST",
      "ACTING_CREW",
      "AMBIENT"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  }
].map(x=>Object.freeze(x)))
  });
  function registry(){return REGISTRY;}
  return Object.freeze({REGISTRY,registry,createsNewUISlot:false,generatesArt:false});
});
