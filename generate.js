const seedrandom = require('seedrandom')

const imageFile = process.argv[2]

if (!imageFile) {
  console.error('Usage: generate.js <path to image file>')
  return
}

const randomSeed = 'xmas2020'
const scaleX = 1
const scaleY = 1
const sampleEveryXPixels = 2
const sampleEveryYPixels = 2
const animationDuration = 1

const message = "MERRY CHRISTMAS CINCH!!!!!1!"
const snowflakeCount = 50

let snowflakes = ''
let snowflakeStyles = ''

const lookup = {
  0: 'A'
}
const encode = (val) => {

}

var rng = seedrandom(randomSeed)

for (let i = 0; i < snowflakeCount; i++) {
  const distance = rng()
  snowflakes += '<p>❄️</p>'
  snowflakeStyles += `.snow p:nth-child(${i + 1}) {--d: ${distance};--e: ${1 - distance};z-index: ${((1-distance) * 100 - 50).toFixed(0)};left: ${rng() * 100}%;animation: snowfall ${distance * 20 + 4}s -${rng() * 10 + 2}s infinite linear, spin ${rng() * 2500 + 2500}ms 0s infinite linear, float 5s ${rng() * 5}s infinite linear;}`
}

let letters = ''
let lettersStyles = ''
for (let i = 0; i < message.length; i++) {
  letters = letters + `<div>${message[i]}</div>`
  lettersStyles = lettersStyles + `.text div:nth-child(${i+1}){--i: ${i}}`
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

  let lastId = 0
  for (let x = 0; x < width; x += sampleEveryXPixels) {
    for (let y = 0; y < height; y += sampleEveryYPixels) {
      const xOut = x / sampleEveryXPixels
      const yOut = y / sampleEveryYPixels

      const id = `_${(lastId++).toString(36)}`
      const element = `<p id="${id}">`

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

        const pad = x => x.length > 1 ? x : `0${x}`
        
        const compress = (r, g, b, a) => {
          if (a === 'ff') {
            return r[0] === r[1] && g[0] === g[1] && b[0] === b[1] ? `${r[0]}${g[0]}${b[0]}` : `${r}${g}${b}`
          } else {
            return r[0] === r[1] && g[0] === g[1] && b[0] === b[1] && a[0] === a[1] ? `${r[0]}${g[0]}${b[0]}${a[0]}` : `${r}${g}${b}${a}`
          }
        }

        const bareKeyframe = `{background:#${compress(pad(r.toString(16)), pad(g.toString(16)), pad(b.toString(16)), pad(a.toString(16)))}}`
        const keyframe = `${percentage}%${bareKeyframe}`
        if (!lastKeyframe) lastKeyframe = `end${bareKeyframe}`

        bareKeyframesArray.push(bareKeyframe)
        if (frame === 0 || bareKeyframesArray[frame - 1] !== bareKeyframe) {
          keyframesArray.push(keyframe)
        }
      }
    
      if (emptyFrameCount !== frameCount) {
        //keyframesArray.push(lastKeyframe)

        const keyframes = keyframesArray.join('')

        let animationName = ''
        if (animationCache.has(keyframes)) {
          animationName = animationCache.get(keyframes)
        } else {
          animationName = `f${(nextAnimationIndex++).toString(16)}`
          animationCache.set(keyframes, animationName)
          allKeyframes = allKeyframes + `@keyframes ${animationName} {${keyframes}}`
        }
  
        const style = `#${id}{--x:${xOut};--y:${yOut};--a:${animationName};}`
        pixelStyles = pixelStyles + style
        elements = elements + element
      }
    }
}

  const template = `<html>
<head><meta charset=“UTF-8”></head><body><style>
:root {
--width: ${sampleEveryXPixels * scaleX}px;
--height: ${sampleEveryYPixels * scaleY}px;
}
div,p {
display: block;
position: absolute;
padding: 0;
margin: 0;
border: 0;
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
animation: fly 30s infinite linear;
}
.santa p {
width: ${sampleEveryXPixels * scaleX}px;
height: ${sampleEveryXPixels * scaleX}px;
left: calc(var(--width) * var(--x));
top: calc(var(--height) * var(--y));
animation: var(--a) ${animationDuration}s infinite steps(1, end);
}
@keyframes fly {
from { left: -${width * 1}px; top: 40%; }
to { left: 100%; top: 20%; }
}
@keyframes spin {
from { transform:rotate(0deg); }
to { transform:rotate(360deg); }
}
@keyframes snowfall {
0% { top: -5%; }
100% { top: 100%; }
}
@keyframes float {
from, to {
transform: translateX(calc((1 - var(--d)) * -20px));
}
50% {
transform: translateX(calc((1 - var(--d)) * 20px));
}
}
.snow {
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
filter: blur(calc(var(--d) * 2px));
opacity: calc((1 - var(--d)) * 0.5 + 0.5);
font-size: calc((var(--e)) * 45px);
}
.moon {
border-radius: 50%;
box-shadow: 25px 10px 0px 0px #d4d27b;
right: 5%;
top: 5%;
width: 115px;
height: 115px;
z-index: -99;
filter: blur(4px);
transform: rotate(-30deg);
}${pixelStyles}${snowflakeStyles}${allKeyframes}
</style>
<div id="bg">
<div class="santa">
${elements}
</div>
<div class="snow">
${snowflakes}
</div>
<div class="moon"></div></body></html>`

  console.log(template)
})