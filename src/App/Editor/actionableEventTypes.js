const actionableEventTypes = [
  [`Location`, [
    `reload`,
    `navigate`,
    `hashchange`
  ]],

  [`History`, [
    `pushstate`,
    `popstate`
  ]],

  [`Clicks`, [
    `click`,
    `contextmenu`,
    `dblclick`,
    `auxclick`
  ]],

  [`Inputs`, [
    `focus`,
    `blur`,
    `input`,
    `change`
  ]],

  [`Forms`, [
    `submit`,
    `reset`
  ]],

  [`Keys`, [
    `keypress`,
    `keydown`,
    `keyup`
  ]],

  [`Mouse`, [
    `mousedown`,
    `mouseenter`,
    `mouseleave`,
    `mousemove`,
    `mouseover`,
    `mouseout`,
    `mouseup`
  ]],

  [`Window`, [
    `resize`,
    `close`,
    `scroll`,
    `wheel`
  ]],

  [`Clipboard`, [
    `cut`,
    `copy`,
    `paste`
  ]],

  [`Selection`, [
    `select`,
    `selectstart`,
    `selectionchange`
  ]],

  [`Drag`, [
    `drag`,
    `dragend`,
    `dragenter`,
    `dragleave`,
    `dragover`,
    `drop`
  ]],

  [`Touch`, [
    `touchcancel`,
    `touchend`,
    `touchmove`,
    `touchstart`
  ]],

  [`Pointer`, [
    `pointerlockchange`,
    `pointerover`,
    `pointerenter`,
    `pointerdown`,
    `pointermove`,
    `pointerup`,
    `pointercancel`,
    `pointerout`,
    `pointerleave`,
    `gotpointercapture`,
    `lostpointercapture`
  ]],

  [`Text Composition`, [
    `compositionstart`,
    `compositionupdate`,
    `compositionend`
  ]],

  [`Value Changes`, [
    `ValueChange`,
    `CheckboxStateChange`,
    `RadioStateChange`,
    `readystatechange`,
    `broadcast`
  ]]
]

export default actionableEventTypes
