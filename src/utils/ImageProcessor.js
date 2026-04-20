export const ImageProcessor = {
  async processImage(imageSrc, pixelCrop, rotation = 0, filter = 'magic') {
    const image = await this.createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    // Set canvas dimensions to the crop size
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped and rotated image
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)
    
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )
    ctx.restore()

    if (filter === 'magic') {
      this.applyMagicFilter(ctx, canvas.width, canvas.height)
    } else if (filter === 'bw') {
      this.applyBWFilter(ctx, canvas.width, canvas.height)
    }

    return canvas.toDataURL('image/jpeg', 0.9)
  },

  createImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })
  },

  applyMagicFilter(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      // Basic auto-level/contrast logic
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Increase contrast and brightness
      const contrast = 1.2
      const brightness = 30
      
      data[i] = Math.min(255, (r - 128) * contrast + 128 + brightness)
      data[i + 1] = Math.min(255, (g - 128) * contrast + 128 + brightness)
      data[i + 2] = Math.min(255, (b - 128) * contrast + 128 + brightness)
    }

    ctx.putImageData(imageData, 0, 0)
  },

  applyBWFilter(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      const threshold = 128
      const val = avg > threshold ? 255 : 0
      data[i] = data[i + 1] = data[i + 2] = val
    }

    ctx.putImageData(imageData, 0, 0)
  }
}
