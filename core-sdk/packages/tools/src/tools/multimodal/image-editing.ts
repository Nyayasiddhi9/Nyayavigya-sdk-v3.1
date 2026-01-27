/**
 * Image Editing Tool
 * Production-ready image manipulation using Sharp
 * Supports resize, crop, rotate, flip, filters, watermarks, and format conversion
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

/**
 * Image Resize Tool Definition
 */
export const imageResizeTool: Tool = {
  id: 'image_resize',
  name: 'Resize Image',
  description: 'Resize an image to specific dimensions with various fit options',
  parameters: [
    {
      name: 'inputPath',
      type: 'string',
      description: 'Path to the input image file',
      required: true,
    },
    {
      name: 'outputPath',
      type: 'string',
      description: 'Path where the resized image will be saved',
      required: true,
    },
    {
      name: 'width',
      type: 'number',
      description: 'Target width in pixels',
      required: false,
    },
    {
      name: 'height',
      type: 'number',
      description: 'Target height in pixels',
      required: false,
    },
    {
      name: 'fit',
      type: 'string',
      description: 'How to fit the image (cover, contain, fill, inside, outside)',
      required: false,
      default: 'cover',
      enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
    },
    {
      name: 'maintainAspectRatio',
      type: 'boolean',
      description: 'Maintain the aspect ratio (default: true)',
      required: false,
      default: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Resize result with output path and dimensions',
  },
  examples: [
    {
      input: {
        inputPath: '/tmp/input.jpg',
        outputPath: '/tmp/output.jpg',
        width: 800,
        height: 600,
        fit: 'cover',
      },
      output: {
        success: true,
        outputPath: '/tmp/output.jpg',
        width: 800,
        height: 600,
      },
    },
  ],
};

/**
 * Image Resize Executor
 */
export const imageResizeExecutor: ToolExecutor = async (params) => {
  const {
    inputPath,
    outputPath,
    width,
    height,
    fit = 'cover',
    maintainAspectRatio = true,
  } = params;

  // Validate input file exists
  if (!existsSync(inputPath)) {
    return {
      success: false,
      error: `Input file not found: ${inputPath}`,
    };
  }

  // Validate at least one dimension is provided
  if (!width && !height) {
    return {
      success: false,
      error: 'At least one dimension (width or height) must be provided',
    };
  }

  try {
    // Import sharp dynamically (it's already installed in the project)
    const sharp = (await import('sharp')).default;

    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Validate metadata
    if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
      return {
        success: false,
        error: 'Invalid image metadata: unable to determine image dimensions',
      };
    }
    
    // Calculate dimensions while maintaining aspect ratio if needed
    let finalWidth = width;
    let finalHeight = height;

    if (maintainAspectRatio && (!width || !height)) {
      const aspectRatio = metadata.width / metadata.height;
      if (width && !height) {
        finalHeight = Math.round(width / aspectRatio);
      } else if (height && !width) {
        finalWidth = Math.round(height * aspectRatio);
      }
    }

    const resizeOptions: any = {
      fit,
    };

    if (finalWidth) resizeOptions.width = finalWidth;
    if (finalHeight) resizeOptions.height = finalHeight;

    const buffer = await image.resize(resizeOptions).toBuffer();
    const resultMetadata = await sharp(buffer).metadata();

    writeFileSync(outputPath, buffer);

    return {
      success: true,
      outputPath,
      width: resultMetadata.width,
      height: resultMetadata.height,
      format: resultMetadata.format,
      size: buffer.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Image resize failed: ${error.message}`,
    };
  }
};

/**
 * Image Crop Tool Definition
 */
export const imageCropTool: Tool = {
  id: 'image_crop',
  name: 'Crop Image',
  description: 'Crop an image to a specific region',
  parameters: [
    {
      name: 'inputPath',
      type: 'string',
      description: 'Path to the input image file',
      required: true,
    },
    {
      name: 'outputPath',
      type: 'string',
      description: 'Path where the cropped image will be saved',
      required: true,
    },
    {
      name: 'x',
      type: 'number',
      description: 'X coordinate of the crop region (left)',
      required: true,
    },
    {
      name: 'y',
      type: 'number',
      description: 'Y coordinate of the crop region (top)',
      required: true,
    },
    {
      name: 'width',
      type: 'number',
      description: 'Width of the crop region',
      required: true,
    },
    {
      name: 'height',
      type: 'number',
      description: 'Height of the crop region',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Crop result with output path and dimensions',
  },
  examples: [
    {
      input: {
        inputPath: '/tmp/input.jpg',
        outputPath: '/tmp/cropped.jpg',
        x: 100,
        y: 100,
        width: 500,
        height: 500,
      },
      output: {
        success: true,
        outputPath: '/tmp/cropped.jpg',
        width: 500,
        height: 500,
      },
    },
  ],
};

/**
 * Image Crop Executor
 */
export const imageCropExecutor: ToolExecutor = async (params) => {
  const { inputPath, outputPath, x, y, width, height } = params;

  // Validate input file exists
  if (!existsSync(inputPath)) {
    return {
      success: false,
      error: `Input file not found: ${inputPath}`,
    };
  }

  try {
    const sharp = (await import('sharp')).default;

    const buffer = await sharp(inputPath)
      .extract({ left: x, top: y, width, height })
      .toBuffer();

    const metadata = await sharp(buffer).metadata();
    writeFileSync(outputPath, buffer);

    return {
      success: true,
      outputPath,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Image crop failed: ${error.message}`,
    };
  }
};

/**
 * Image Filter Tool Definition
 */
export const imageFilterTool: Tool = {
  id: 'image_filter',
  name: 'Apply Image Filter',
  description: 'Apply various filters and effects to an image (grayscale, blur, sharpen, brightness, contrast)',
  parameters: [
    {
      name: 'inputPath',
      type: 'string',
      description: 'Path to the input image file',
      required: true,
    },
    {
      name: 'outputPath',
      type: 'string',
      description: 'Path where the filtered image will be saved',
      required: true,
    },
    {
      name: 'filter',
      type: 'string',
      description: 'Filter type to apply',
      required: true,
      enum: ['grayscale', 'blur', 'sharpen', 'negate', 'normalize'],
    },
    {
      name: 'blurAmount',
      type: 'number',
      description: 'Blur amount (for blur filter, 0.3-1000)',
      required: false,
      default: 5,
    },
    {
      name: 'brightness',
      type: 'number',
      description: 'Brightness adjustment (-1 to 1, 0 = no change)',
      required: false,
    },
    {
      name: 'saturation',
      type: 'number',
      description: 'Saturation adjustment (0 = grayscale, 1 = normal, >1 = boosted)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Filter result with output path',
  },
  examples: [
    {
      input: {
        inputPath: '/tmp/input.jpg',
        outputPath: '/tmp/filtered.jpg',
        filter: 'blur',
        blurAmount: 5,
      },
      output: {
        success: true,
        outputPath: '/tmp/filtered.jpg',
        filter: 'blur',
      },
    },
  ],
};

/**
 * Image Filter Executor
 */
export const imageFilterExecutor: ToolExecutor = async (params) => {
  const {
    inputPath,
    outputPath,
    filter,
    blurAmount = 5,
    brightness,
    saturation,
  } = params;

  // Validate input file exists
  if (!existsSync(inputPath)) {
    return {
      success: false,
      error: `Input file not found: ${inputPath}`,
    };
  }

  try {
    // Validate brightness parameter
    if (brightness !== undefined && (brightness < -1 || brightness > 1)) {
      return {
        success: false,
        error: 'Brightness must be between -1 and 1',
      };
    }

    // Validate saturation parameter
    if (saturation !== undefined && saturation < 0) {
      return {
        success: false,
        error: 'Saturation must be >= 0',
      };
    }

    const sharp = (await import('sharp')).default;
    let image = sharp(inputPath);

    switch (filter) {
      case 'grayscale':
        image = image.grayscale();
        break;
      case 'blur':
        image = image.blur(Math.max(0.3, Math.min(1000, blurAmount)));
        break;
      case 'sharpen':
        image = image.sharpen();
        break;
      case 'negate':
        image = image.negate();
        break;
      case 'normalize':
        image = image.normalize();
        break;
    }

    // Apply modulate for brightness and saturation
    if (brightness !== undefined || saturation !== undefined) {
      const modulateOptions: any = {};
      if (brightness !== undefined) {
        // Clamp brightness to valid range and convert to Sharp format
        modulateOptions.brightness = Math.max(0, 1 + brightness);
      }
      if (saturation !== undefined) {
        modulateOptions.saturation = saturation;
      }
      image = image.modulate(modulateOptions);
    }

    const buffer = await image.toBuffer();
    writeFileSync(outputPath, buffer);

    return {
      success: true,
      outputPath,
      filter,
      size: buffer.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Image filter failed: ${error.message}`,
    };
  }
};

/**
 * Image Watermark Tool Definition
 */
export const imageWatermarkTool: Tool = {
  id: 'image_watermark',
  name: 'Add Watermark to Image',
  description: 'Add a text or image watermark to an image',
  parameters: [
    {
      name: 'inputPath',
      type: 'string',
      description: 'Path to the input image file',
      required: true,
    },
    {
      name: 'outputPath',
      type: 'string',
      description: 'Path where the watermarked image will be saved',
      required: true,
    },
    {
      name: 'watermarkPath',
      type: 'string',
      description: 'Path to the watermark image file (PNG with transparency recommended)',
      required: true,
    },
    {
      name: 'position',
      type: 'string',
      description: 'Watermark position',
      required: false,
      default: 'bottom-right',
      enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
    },
    {
      name: 'opacity',
      type: 'number',
      description: 'Watermark opacity (0-1, default: 0.5)',
      required: false,
      default: 0.5,
    },
  ],
  returns: {
    type: 'object',
    description: 'Watermark result with output path',
  },
  examples: [
    {
      input: {
        inputPath: '/tmp/input.jpg',
        outputPath: '/tmp/watermarked.jpg',
        watermarkPath: '/tmp/logo.png',
        position: 'bottom-right',
        opacity: 0.5,
      },
      output: {
        success: true,
        outputPath: '/tmp/watermarked.jpg',
      },
    },
  ],
};

/**
 * Image Watermark Executor
 */
export const imageWatermarkExecutor: ToolExecutor = async (params) => {
  const {
    inputPath,
    outputPath,
    watermarkPath,
    position = 'bottom-right',
    opacity = 0.5,
  } = params;

  // Validate input files exist
  if (!existsSync(inputPath)) {
    return {
      success: false,
      error: `Input file not found: ${inputPath}`,
    };
  }

  if (!existsSync(watermarkPath)) {
    return {
      success: false,
      error: `Watermark file not found: ${watermarkPath}`,
    };
  }

  try {
    // Validate opacity parameter
    if (opacity < 0 || opacity > 1) {
      return {
        success: false,
        error: 'Opacity must be between 0 and 1',
      };
    }

    const sharp = (await import('sharp')).default;

    const mainImage = sharp(inputPath);
    const mainMetadata = await mainImage.metadata();
    
    if (!mainMetadata.width || !mainMetadata.height) {
      return {
        success: false,
        error: 'Invalid main image metadata',
      };
    }
    
    // Convert watermark to PNG with alpha channel and apply opacity
    let watermark = await sharp(watermarkPath)
      .png() // Convert to PNG format
      .ensureAlpha()
      .toBuffer();

    const watermarkMetadata = await sharp(watermark).metadata();

    if (!watermarkMetadata.width || !watermarkMetadata.height) {
      return {
        success: false,
        error: 'Invalid watermark image metadata',
      };
    }

    // Check if watermark is larger than main image, resize if needed
    let finalWatermark = watermark;
    let finalWatermarkWidth = watermarkMetadata.width;
    let finalWatermarkHeight = watermarkMetadata.height;

    // Calculate safe max dimensions (at least 1px)
    const maxWidth = Math.max(1, mainMetadata.width - 40);
    const maxHeight = Math.max(1, mainMetadata.height - 40);

    if (watermarkMetadata.width > maxWidth || watermarkMetadata.height > maxHeight) {
      // Resize watermark to fit within main image
      const aspectRatio = watermarkMetadata.width / watermarkMetadata.height;
      
      if (watermarkMetadata.width / maxWidth > watermarkMetadata.height / maxHeight) {
        finalWatermarkWidth = maxWidth;
        finalWatermarkHeight = Math.max(1, Math.round(maxWidth / aspectRatio));
      } else {
        finalWatermarkHeight = maxHeight;
        finalWatermarkWidth = Math.max(1, Math.round(maxHeight * aspectRatio));
      }

      finalWatermark = await sharp(watermark)
        .resize(finalWatermarkWidth, finalWatermarkHeight)
        .toBuffer();
    }

    // Apply opacity to watermark
    if (opacity < 1) {
      finalWatermark = await sharp(finalWatermark)
        .composite([{
          input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: 'dest-in',
        }])
        .toBuffer();
    }

    // Calculate position (clamped to non-negative)
    let left = 0;
    let top = 0;
    const padding = 20;

    switch (position) {
      case 'top-left':
        left = padding;
        top = padding;
        break;
      case 'top-right':
        left = Math.max(0, mainMetadata.width - finalWatermarkWidth - padding);
        top = padding;
        break;
      case 'bottom-left':
        left = padding;
        top = Math.max(0, mainMetadata.height - finalWatermarkHeight - padding);
        break;
      case 'bottom-right':
        left = Math.max(0, mainMetadata.width - finalWatermarkWidth - padding);
        top = Math.max(0, mainMetadata.height - finalWatermarkHeight - padding);
        break;
      case 'center':
        left = Math.max(0, Math.floor((mainMetadata.width - finalWatermarkWidth) / 2));
        top = Math.max(0, Math.floor((mainMetadata.height - finalWatermarkHeight) / 2));
        break;
    }

    const buffer = await mainImage
      .composite([{
        input: finalWatermark,
        left,
        top,
        blend: 'over',
      }])
      .toBuffer();

    writeFileSync(outputPath, buffer);

    return {
      success: true,
      outputPath,
      position,
      opacity,
      size: buffer.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Image watermark failed: ${error.message}`,
    };
  }
};

/**
 * Image Format Conversion Tool Definition
 */
export const imageConvertTool: Tool = {
  id: 'image_convert',
  name: 'Convert Image Format',
  description: 'Convert an image between different formats (JPEG, PNG, WebP, AVIF, TIFF)',
  parameters: [
    {
      name: 'inputPath',
      type: 'string',
      description: 'Path to the input image file',
      required: true,
    },
    {
      name: 'outputPath',
      type: 'string',
      description: 'Path where the converted image will be saved',
      required: true,
    },
    {
      name: 'format',
      type: 'string',
      description: 'Target image format',
      required: true,
      enum: ['jpeg', 'png', 'webp', 'avif', 'tiff'],
    },
    {
      name: 'quality',
      type: 'number',
      description: 'Output quality (1-100, default: 80)',
      required: false,
      default: 80,
    },
  ],
  returns: {
    type: 'object',
    description: 'Conversion result with output path',
  },
  examples: [
    {
      input: {
        inputPath: '/tmp/input.png',
        outputPath: '/tmp/output.webp',
        format: 'webp',
        quality: 85,
      },
      output: {
        success: true,
        outputPath: '/tmp/output.webp',
        format: 'webp',
      },
    },
  ],
};

/**
 * Image Format Conversion Executor
 */
export const imageConvertExecutor: ToolExecutor = async (params) => {
  const { inputPath, outputPath, format, quality = 80 } = params;

  // Validate input file exists
  if (!existsSync(inputPath)) {
    return {
      success: false,
      error: `Input file not found: ${inputPath}`,
    };
  }

  try {
    const sharp = (await import('sharp')).default;
    let image = sharp(inputPath);

    switch (format) {
      case 'jpeg':
        image = image.jpeg({ quality });
        break;
      case 'png':
        image = image.png({ quality });
        break;
      case 'webp':
        image = image.webp({ quality });
        break;
      case 'avif':
        image = image.avif({ quality });
        break;
      case 'tiff':
        image = image.tiff({ quality });
        break;
    }

    const buffer = await image.toBuffer();
    writeFileSync(outputPath, buffer);

    return {
      success: true,
      outputPath,
      format,
      size: buffer.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Image format conversion failed: ${error.message}`,
    };
  }
};
