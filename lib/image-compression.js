/**
 * Compress an image file to reduce size before upload
 * Target: Keep under 1MB for Vercel compatibility
 */
export async function compressImage(file, maxSizeMB = 1, maxWidthOrHeight = 1920) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height * maxWidthOrHeight) / width)
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width * maxWidthOrHeight) / height)
            height = maxWidthOrHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Start with quality 0.8 and reduce if needed
        let quality = 0.8
        const targetSize = maxSizeMB * 1024 * 1024

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'))
                return
              }

              // If still too large and quality can be reduced, try again
              if (blob.size > targetSize && quality > 0.3) {
                quality -= 0.1
                tryCompress()
                return
              }

              // Create a new File object from the blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })

              console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`)
              resolve(compressedFile)
            },
            'image/jpeg',
            quality
          )
        }

        tryCompress()
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
  })
}
