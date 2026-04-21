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

    // Apply Filter
    if (filter === 'magic') {
      this.applyMagicFilter(ctx, canvas.width, canvas.height)
    } else if (filter === 'bw') {
      this.applyBWFilter(ctx, canvas.width, canvas.height)
    } else if (filter === 'grayscale') {
      this.applyGrayscaleFilter(ctx, canvas.width, canvas.height)
    }

    return canvas.toDataURL('image/jpeg', 0.95)
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

    // 1. Contrast & Brightness Boost
    const contrast = 1.6
    const brightness = 20
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast
      data[i] = factor * (data[i] - 128) + 128 + brightness
      data[i+1] = factor * (data[i+1] - 128) + 128 + brightness
      data[i+2] = factor * (data[i+2] - 128) + 128 + brightness

      // 2. Simple "White Background" thresholding
      // If a pixel is already very bright, make it white
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (avg > 180) {
        data[i] = Math.min(255, data[i] + 30)
        data[i+1] = Math.min(255, data[i+1] + 30)
        data[i+2] = Math.min(255, data[i+2] + 30)
      }
    }

    ctx.putImageData(imageData, 0, 0)
  },

  applyBWFilter(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114)
      const threshold = 128
      const val = avg > threshold ? 255 : 0
      data[i] = data[i + 1] = data[i + 2] = val
    }

    ctx.putImageData(imageData, 0, 0)
  },

  applyGrayscaleFilter(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114)
      data[i] = data[i + 1] = data[i + 2] = avg
    }

    ctx.putImageData(imageData, 0, 0)
  },

  /**
   * Stitches two ID card sides side-by-side on a virtual A4-style page.
   */
  async stitchIDCard(frontUri, backUri) {
    const front = await this.createImage(frontUri)
    const back = await this.createImage(backUri)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // We use a high-res landscape A4-style canvas for side-by-side
    canvas.width = 2480 // 300 DPI A4 is 2480x3508
    canvas.height = 1754 

    // Background white (for clean print)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate dimensions for ID cards (roughly 85.6mm x 53.98mm)
    // We'll scale them to fit the width comfortably
    const margin = 100
    const cardWidth = (canvas.width / 2) - (margin * 2)
    const cardHeight = (front.height * cardWidth) / front.width

    // Draw Front
    ctx.drawImage(front, margin, margin, cardWidth, cardHeight)
    
    // Draw Back
    ctx.drawImage(back, (canvas.width / 2) + margin, margin, cardWidth, cardHeight)

    return canvas.toDataURL('image/jpeg', 0.9)
  }
}
