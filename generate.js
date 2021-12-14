const seedrandom = require('seedrandom')

const imageFile = process.argv[2]

if (!imageFile) {
  console.error('Usage: generate.js <path to image file>')
  return
}

const randomSeed = 'xmas_2020'
const scaleX = 1
const scaleY = 1
const sampleEveryXPixels = 3
const sampleEveryYPixels = 3
const animationDuration = 1

const snowflakeCount = 100

let snowflakes = ''
let snowflakeStyles = ''

var rng = seedrandom(randomSeed)

const optimise = (value, dp) => {
  let out = value.toFixed(dp)
  if (dp > 0 && out[dp + 1] === '0') out = out.substring(0, out.length - 1)
  if (out[0] === '0') out = out.substring(1)
  return out
}

for (let i = 0; i < snowflakeCount; i++) {
  const distance = rng()
  snowflakes += '<p>❄️'
  snowflakeStyles += `.s p:nth-child(${i + 1}){--d:${optimise(distance,2)};z-index:${optimise((1 - distance) * 100 - 50, 0)};left:${optimise(rng() * 100, 0)}%;animation: snowfall ${optimise(distance * 20 + 4, 2)}s -${optimise(rng() * 10 + 2, 2)}s infinite linear,spin ${optimise(rng() * 2500 + 2500, 2)}ms 0s infinite linear,float 5s ${optimise(rng() * 5, 2)}s infinite linear}`
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

  const frameCount = isGif ? 5 : 1

  let lastId = 0
  for (let x = 0; x < width; x += sampleEveryXPixels) {
    for (let y = 0; y < height; y += sampleEveryYPixels) {
      const xOut = x / sampleEveryXPixels
      const yOut = y / sampleEveryYPixels

      let id = (lastId).toString(36)
      while (id[0] === '0' || id[0] === '1' || id[0] === '2' || id[0] === '3' || id[0] === '4' || id[0] === '5' || id[0] === '6' || id[0] === '7' || id[0] === '8' || id[0] === '9') {
        lastId++
        id = (lastId).toString(36)
      }
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

        const bareKeyframe = `{--b:#${compress(pad(r.toString(16)), pad(g.toString(16)), pad(b.toString(16)), pad(a.toString(16)))}}`
        const keyframe = `${percentage}%${bareKeyframe}`
        if (!lastKeyframe) lastKeyframe = `end${bareKeyframe}`

        bareKeyframesArray.push(bareKeyframe)
        if (frame === 0 || bareKeyframesArray[frame - 1] !== bareKeyframe) {
          keyframesArray.push(keyframe)
        }
      }
    
      if (emptyFrameCount !== frameCount) {
        //keyframesArray.push(lastKeyframe)
        lastId++

        const keyframes = keyframesArray.join('')

        let animationName = ''
        if (animationCache.has(keyframes)) {
          animationName = animationCache.get(keyframes)
        } else {
          let aId = nextAnimationIndex.toString(36)
          while (aId[0] === '0' || aId[0] === '1' || aId[0] === '2' || aId[0] === '3' || aId[0] === '4' || aId[0] === '5' || aId[0] === '6' || aId[0] === '7' || aId[0] === '8' || aId[0] === '9') {
            nextAnimationIndex++
            aId = nextAnimationIndex.toString(36)
          }

          animationName = aId
          nextAnimationIndex++

          animationCache.set(keyframes, animationName)
          allKeyframes = allKeyframes + `@keyframes ${animationName}{${keyframes}}`
        }
  
        const style = `#${id}{--x:${xOut};--y:${yOut};--a:${animationName}}`
        pixelStyles = pixelStyles + style
        elements = elements + element
      }
    }
}

  const template = `<html>
<head><meta charset=“UTF-8”></head><body><style>
html, body, bg {margin: 0; height: 100%; overflow: hidden}
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
.santa {
animation: fly 30s infinite linear;
}
.santa p {
width: ${sampleEveryXPixels * scaleX}px;
height: ${sampleEveryXPixels * scaleX}px;
left: calc(var(--x) * ${sampleEveryXPixels * scaleX}px);
top: calc(var(--y) * ${sampleEveryYPixels * scaleY}px);
animation: var(--a) ${animationDuration}s infinite steps(1, end);
background: var(--b);
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
.s {
left: 0;
top: 0;
width: 100%;
height: 100%;
}
.s p {
display: block;
position: absolute;
margin: 0;
padding: 0;
filter: blur(calc(var(--d) * 2px));
opacity: calc((1 - var(--d)) * 0.5 + 0.5);
font-size: calc((calc(1 - var(--d))) * 45px);
}
.moon {
border-radius: 50%;
box-shadow: 25px 10px 0 0 #d4d27b;
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
<div class="s">
${snowflakes}
</div>
<div class="moon"></div></body></html>`

  console.log(template)
})