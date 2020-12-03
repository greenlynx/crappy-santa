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

require("get-pixels")(imageFile, function (err, pixels) {
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
        styles = styles + style
        elements = elements + element
      }
    }
}

  const template = `<html>
<body>
<style>
  :root {
    --width: ${sampleEveryXPixels * scaleX}px;
    --height: ${sampleEveryYPixels * scaleY}px;
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
  }
  .santa div {
    display: block;
    position: absolute;
    width: ${sampleEveryXPixels * scaleX}px;
    height: ${sampleEveryXPixels * scaleX}px;
    left: calc(var(--width) * var(--x));
    top: calc(var(--height) * var(--y));
    animation-name: var(--a);
    animation-iteration-count: infinite;
    animation-duration: ${animationDuration}s;
    animation-direction: alternate;
    animation-timing-function: linear;
  }
  ${styles}
  ${allKeyframes}
</style>
<div class="santa">
${elements}
</div>
<body>
  <html>`

  console.log(template)
})

