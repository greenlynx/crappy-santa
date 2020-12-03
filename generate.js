const seedrandom = require('seedrandom')

const imageFile = process.argv[2]

if (!imageFile) {
  console.error('Usage: generate.js <path to image file>')
  return
}

const randomSeed = 'xmas'
const scaleX = 1
const scaleY = 1
const sampleEveryXPixels = 1
const sampleEveryYPixels = 1
const animationDuration = 1

const snowflakeCount = 50

let snowflakes = ''
let snowflakeStyles = ''

var rng = seedrandom(randomSeed)

for (let i = 0; i < snowflakeCount; i++) {
  snowflakes += '<p>❄️</p>'
  snowflakeStyles += `.snow p:nth-child(${i+1}) {
    font-size: ${rng() * 45}px;
    left: ${rng() * 100}%;
    animation-duration: ${rng() * 20 + 4}s;
    animation-delay: -${rng() * 10 + 2}s;
    opacity: ${rng() * 0.5 + 0.5};
  }`
}

require("get-pixels")(imageFile, function (err, pixels) {
  if(err) {
    console.error("Bad image path")
    return
  }

  const isGif = pixels.shape.length === 4

  let pixelStyles = ''
  let elements = ''

  const width = pixels.shape[isGif ? 1 : 0]
  const height = pixels.shape[isGif ? 2 : 1]

  let allKeyframes = ''

  const animationCache = new Map()
  let nextAnimationIndex = 0

  const frameCount = isGif ? pixels.shape[3] : 1

  for (let x = 0; x < width; x += sampleEveryXPixels) {
    for (let y = 0; y < height; y += sampleEveryYPixels) {
      const xOut = x / sampleEveryXPixels
      const yOut = y / sampleEveryYPixels

      const id = `x${xOut}y${yOut}`
      const element = `<div class="${id}"/></div>`

      let lastKeyframe = ''
      let bareKeyframesArray = []
      let keyframesArray = []

      let emptyFrameCount = 0
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

        if (a === 0) emptyFrameCount++

        const bareKeyframe = `{background:rgba(${r},${g},${b},${a})}`
        const keyframe = `${percentage}%${bareKeyframe}`
        if (!lastKeyframe) lastKeyframe = `100%{background:rgba(${r},${g},${b},${a})}`

        bareKeyframesArray.push(bareKeyframe)
        //if (frame === 0 || bareKeyframesArray[frame - 1] !== bareKeyframe) {
          keyframesArray.push(keyframe)
        //}
      }
    
      if (emptyFrameCount !== frameCount) {
        keyframesArray.push(lastKeyframe)

        const keyframes = keyframesArray.join('')

        let animationName = ''
        if (animationCache.has(keyframes)) {
          animationName = animationCache.get(keyframes)
        } else {
          animationName = `f${nextAnimationIndex++}`
          animationCache.set(keyframes, animationName)
          allKeyframes = allKeyframes + `@keyframes ${animationName} {${keyframes}}`
        }
  
        const style = `.${id}{--x:${xOut};--y:${yOut};--a:${animationName};}`
        pixelStyles = pixelStyles + style
        elements = elements + element
      }
    }
}

  const template = `<html>
<head><meta charset=“UTF-8”></head>
<body>
<style>
  /*! minireset.css v0.0.6 | MIT License | github.com/jgthms/minireset.css */html,body,p,ol,ul,li,dl,dt,dd,blockquote,figure,fieldset,legend,textarea,pre,iframe,hr,h1,h2,h3,h4,h5,h6{margin:0;padding:0}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal}ul{list-style:none}button,input,select,textarea{margin:0}html{box-sizing:border-box}*,*::before,*::after{box-sizing:inherit}img,video{height:auto;max-width:100%}iframe{border:0}table{border-collapse:collapse;border-spacing:0}td,th{padding:0}td:not([align]),th:not([align]){text-align:left}
  body {
    width: 100%;
    height: 100%;

  }
  @keyframes fadein {
    0% { opacity: 0; }
    80% { opacity: 0; }
    100% { opacity: 1; }
  }
  .santa {
    opacity: 1;
    animation-iteration-count: 1;
    animation-name: fade-in;
    animation-duration: 5s;
    z-index: 0;
  }
  .santa div {
    display: block;
    position: absolute;
    width: ${sampleEveryXPixels * scaleX}px;
    height: ${sampleEveryXPixels * scaleX}px;
    left: calc(${sampleEveryXPixels * scaleX} * var(--x));
    top: calc(${sampleEveryYPixels * scaleY} * var(--y));
    animation-name: var(--a);
    animation-iteration-count: infinite;
    animation-duration: ${animationDuration}s;
    animation-direction: alternate;
    animation-timing-function: linear;
  }

  @keyframes snowfall {
    0% { top: 0%; }
    100% { top: 100%; }
  }
  .snow {
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .snow p {
    display: block;
    position: absolute;
    margin: 0;
    padding: 0;
    animation-name: snowfall;
    animation-iteration-count: infinite;
    animation-duration: 8s;
    animation-timing-function: linear;
  }
  ${pixelStyles}
  ${snowflakeStyles}
  ${allKeyframes}
</style>
<div class="santa">
${elements}
</div>
<div class="snow">
${snowflakes}
</div>
<body>
  <html>`

  console.log(template)
})

