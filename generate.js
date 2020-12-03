const imageFile = process.argv[2]

if (!imageFile) {
  console.error('Usage: generate.js <path to image file>')
  return
}

const scaleX = 1
const scaleY = 1
const sampleEveryXPixels = 1
const sampleEveryYPixels = 1
const animationDuration = 1

const pixels = require("get-pixels")(imageFile, function (err, pixels) {
  if(err) {
    console.error("Bad image path")
    return
  }

  const isGif = pixels.shape.length === 4

  let styles = ''
  let elements = ''

  const width = pixels.shape[isGif ? 1 : 0]
  const height = pixels.shape[isGif ? 2 : 1]

  let allKeyframes = ''

  const frameCount = isGif ? pixels.shape[3] : 1

  for (let x = 0; x < width; x += sampleEveryXPixels) {
    for (let y = 0; y < height; y += sampleEveryYPixels) {
      const xOut = x / sampleEveryXPixels
      const yOut = y / sampleEveryYPixels

      const id = `x${xOut}y${yOut}`
      const style = `#${id}{--x:${xOut};--y:${yOut}; animation-name: frames-${id};}`
      const element = `<div id="${id}"></div>`
      
      styles = styles + style
      elements = elements + element

      let lastKeyframe = ''
      let keyframes = ''

      for (let frame = 0; frame < frameCount; ++frame) {
        const percentage = (frame / frameCount) * 100
    
        let r
        let g
        let b
        let a

        if (isGif) {
          r = pixels.get(frame, x, y, 0)
          g = pixels.get(frame, x, y, 1)
          b = pixels.get(frame, x, y, 2)
          a = pixels.get(frame, x, y, 3)
        } else {
          r = pixels.get(x, y, 0)
          g = pixels.get(x, y, 1)
          b = pixels.get(x, y, 2)
          a = 255
        }

        const keyframe = `${percentage}% { background-color:rgba(${r},${g},${b},${a}) }`
        if (!lastKeyframe) lastKeyframe = `100% { background-color:rgba(${r},${g},${b},${a}) }`

        keyframes = keyframes + keyframe
      }
    
    keyframes = keyframes + lastKeyframe
    allKeyframes = allKeyframes + `@keyframes frames-${id} { ${keyframes} }
    `          
    }
  }

  const template = `<html>
<body>
<style>
  :root {
  --width: ${sampleEveryXPixels * scaleX}px;
  --height: ${sampleEveryYPixels * scaleY}px;
}
  div {
    display: block;
    position: absolute;
    width: var(--width);
    height: var(--height);
    left: calc(var(--width) * var(--x));
    top: calc(var(--height) * var(--y));
    animation-iteration-count: infinite;
    animation-duration: ${animationDuration}s;
    animation-direction: alternate;
  }
  ${styles}
  ${allKeyframes}
</style>
${elements}
<body>
  <html>`

  console.log(template)
})

