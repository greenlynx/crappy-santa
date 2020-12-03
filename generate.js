const seedrandom = require('seedrandom')

const imageFile = process.argv[2]

if (!imageFile) {
  console.error('Usage: generate.js <path to image file>')
  return
}

const randomSeed = 'xmas2020'
const scaleX = 1
const scaleY = 1
const sampleEveryXPixels = 3
const sampleEveryYPixels = 3
const animationDuration = 1

const snowflakeCount = 50

let snowflakes = ''
let snowflakeStyles = ''

var rng = seedrandom(randomSeed)

for (let i = 0; i < snowflakeCount; i++) {
  const distance = rng()
  snowflakes += '<p>❄️</p>'
  snowflakeStyles += `.snow p:nth-child(${i + 1}) {
    --distance: ${distance};
    z-index: ${((1-distance) * 100 - 50).toFixed(0)};
    font-size: ${(1-distance) * 45}px;
    left: ${rng() * 100}%;
    animation: snowfall ${distance * 20 + 4}s -${rng() * 10 + 2}s infinite linear,  spin ${rng() * 2500 + 2500}ms 0s infinite linear, float 5s ${rng() * 5}s infinite linear;
    opacity: ${(1 - distance) * 0.5 + 0.5};
    filter: blur(${distance * 2}px);
  }
  `
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
  :root {
    --width: ${sampleEveryXPixels * scaleX}px;
    --height: ${sampleEveryYPixels * scaleY}px;
  }
  div {
    display: block;
    position: absolute;
  }
  #bg {
    top: 0;
    left: 0;
    z-index: -100;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, rgba(10,10,115,1) 0%, rgba(2,0,36,1) 100%);
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
    animation: fly 30s infinite linear;
  }
  .santa div {
    width: ${sampleEveryXPixels * scaleX}px;
    height: ${sampleEveryXPixels * scaleX}px;
    left: calc(var(--width) * var(--x));
    top: calc(var(--height) * var(--y));
    animation: var(--a) ${animationDuration}s infinite steps(1, end);
  }
  .roof {
    width: 0; 
    height: 0; 
    border-left: 45px solid transparent;
    border-right: 45px solid transparent;
    
    border-bottom: 45px solid red;
  }

  @keyframes fly {
    from { left: -${width}px; top: 40%; }
    to { left: 100%; top: 20%; }
  }
  @keyframes spin {
    from { transform:rotate(0deg); }
    to { transform:rotate(360deg); }
  }
  @keyframes spin {
    from {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(360deg);
    }
  }
  @keyframes snowfall {
    0% { top: -5%; }
    100% { top: 100%; }
  }
  @keyframes snowdrift {
    0% { left: 100%; }
    100% { left: -5%; }
  }
  @keyframes float {
    from, to {
      transform: translateX(calc((1 - var(--distance)) * -20px));
    }
    50% {
      transform: translateX(calc((1 - var(--distance)) * 20px));
    }
  }  .snow {
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
  }
  .snow p {
    display: block;
    position: absolute;
    margin: 0;
    padding: 0;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }
  ${pixelStyles}
  ${snowflakeStyles}
  ${allKeyframes}
</style>
<div id="bg">
<div class="santa">
${elements}
</div>
<div class="snow">
${snowflakes}
</div>
<div class="roof"></div>
</div>
<body>
  <html>`

  console.log(template)
})

