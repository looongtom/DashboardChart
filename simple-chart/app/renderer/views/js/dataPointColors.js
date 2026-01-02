/**
 * Utility functions for generating colors for data points
 * Sử dụng thuật toán phân tầng (layered approach) để tối đa hóa sự phân biệt giữa các màu
 * bất kể số lượng data points là bao nhiêu
 */

/**
 * Chuyển đổi HSL sang RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - RGB color string (rgb(r, g, b))
 */
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

/**
 * Bảng màu cơ sở - các màu được chọn cẩn thận để phân biệt tốt
 * Sử dụng cho các data points đầu tiên
 */
const BASE_COLORS = [
  { h: 0, s: 70, l: 50 },    // Đỏ
  { h: 210, s: 70, l: 50 },  // Xanh dương
  { h: 30, s: 70, l: 50 },   // Cam
  { h: 150, s: 70, l: 50 },  // Xanh lá
  { h: 270, s: 70, l: 50 },  // Tím
  { h: 60, s: 70, l: 50 },   // Vàng
  { h: 330, s: 70, l: 50 },  // Hồng
  { h: 180, s: 70, l: 50 },  // Cyan
  { h: 90, s: 70, l: 50 },   // Xanh lá sáng
  { h: 15, s: 70, l: 50 },   // Cam đỏ
  { h: 240, s: 70, l: 50 },  // Xanh dương đậm
  { h: 300, s: 70, l: 50 },  // Magenta
];

/**
 * Tạo màu cho data point dựa trên index với thuật toán phân tầng
 * Thuật toán này tối đa hóa sự phân biệt bằng cách:
 * 1. Sử dụng bảng màu cơ sở cho các màu đầu tiên
 * 2. Phân tầng: thay đổi cả hue, saturation và lightness
 * 3. Điều chỉnh động dựa trên số lượng data points
 * 
 * @param {number} index - Index của data point (bắt đầu từ 0)
 * @param {number} total - Tổng số data points
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.startHue - Màu bắt đầu trên vòng tròn màu (0-360), mặc định 0 (đỏ)
 * @returns {string} - RGB color string (rgb(r, g, b))
 */
export function generateDataPointColor(index, total = null, options = {}) {
  const { startHue = 0 } = options;

  // Sử dụng bảng màu cơ sở cho các màu đầu tiên
  if (index < BASE_COLORS.length) {
    const baseColor = BASE_COLORS[index];
    return hslToRgb(
      (baseColor.h + startHue) % 360,
      baseColor.s,
      baseColor.l
    );
  }

  // Với nhiều data points, sử dụng thuật toán phân tầng
  if (total && total > 0) {
    const remainingColors = total - BASE_COLORS.length;
    
    // Tính số tầng cần thiết
    // Mỗi tầng có thể chứa khoảng 12 màu (dựa trên BASE_COLORS)
    const colorsPerLayer = 12;
    const layer = Math.floor((index - BASE_COLORS.length) / colorsPerLayer);
    const positionInLayer = (index - BASE_COLORS.length) % colorsPerLayer;
    const totalLayers = Math.ceil(remainingColors / colorsPerLayer);

    // Tính hue: phân bố đều trên vòng tròn với khoảng cách tối thiểu
    // Sử dụng golden angle (137.5 độ) để tạo phân bố tự nhiên và phân biệt tốt
    const goldenAngle = 137.508; // Golden angle in degrees
    const hueStep = remainingColors > colorsPerLayer 
      ? 360 / colorsPerLayer  // Phân bố đều trong mỗi tầng
      : 360 / remainingColors; // Nếu ít màu, phân bố đều trên toàn bộ vòng tròn
    
    // Tính base hue với offset để tránh trùng với BASE_COLORS
    let baseHue;
    if (remainingColors <= colorsPerLayer) {
      // Nếu ít màu, phân bố đều trên vòng tròn
      baseHue = (startHue + positionInLayer * hueStep) % 360;
    } else {
      // Nhiều màu: sử dụng golden angle trong mỗi tầng
      const goldenHue = (positionInLayer * goldenAngle) % 360;
      baseHue = (startHue + goldenHue) % 360;
    }

    // Điều chỉnh saturation và lightness theo tầng để tăng độ phân biệt
    // Mỗi tầng có saturation và lightness khác nhau để tạo sự khác biệt rõ ràng
    let saturation, lightness;
    
    if (layer === 0) {
      saturation = 75;
      lightness = 50;
    } else if (layer === 1) {
      saturation = 65;
      lightness = 60; // Sáng hơn
    } else if (layer === 2) {
      saturation = 65;
      lightness = 40; // Tối hơn
    } else if (layer === 3) {
      saturation = 55;
      lightness = 55; // Trung bình sáng
    } else if (layer === 4) {
      saturation = 70;
      lightness = 45; // Trung bình tối
    } else {
      // Tầng 5+: luân phiên giữa các mức để tối đa hóa sự khác biệt
      const layerMod = layer % 4;
      if (layerMod === 0) {
        saturation = 50;
        lightness = 58;
      } else if (layerMod === 1) {
        saturation = 68;
        lightness = 42;
      } else if (layerMod === 2) {
        saturation = 60;
        lightness = 52;
      } else {
        saturation = 55;
        lightness = 48;
      }
    }

    // Thêm offset vào hue dựa trên tầng để đảm bảo không trùng lặp
    // Offset tăng dần theo tầng để tạo sự khác biệt
    const layerHueOffset = (layer * 20) % 360;
    const hue = (baseHue + layerHueOffset) % 360;

    return hslToRgb(hue, saturation, lightness);
  } else {
    // Fallback: sử dụng golden ratio nếu không có total
    const goldenRatio = 0.618033988749895;
    const hue = (startHue + (index * 360 * goldenRatio)) % 360;
    return hslToRgb(hue, 70, 50);
  }
}

/**
 * Tự động gán màu cho các data points dựa trên thứ tự của chúng
 * 
 * @param {Array} dataPoints - Mảng các data points (có thể không có thuộc tính color)
 * @param {Object} options - Tùy chọn cấu hình màu (xem generateDataPointColor)
 * @returns {Array} - Mảng data points đã được gán màu
 */
export function assignDataPointColors(dataPoints, options = {}) {
  if (!Array.isArray(dataPoints)) {
    return [];
  }

  const total = dataPoints.length;

  return dataPoints.map((dataPoint, index) => {
    // Nếu data point đã có màu, giữ nguyên; nếu không, tạo màu mới
    const color = dataPoint.color || generateDataPointColor(index, total, options);
    
    return {
      ...dataPoint,
      color: color
    };
  });
}

