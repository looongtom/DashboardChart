// Plugin to dynamically adjust time scale to prevent timestamp overlap
export const timeScaleAdjustPlugin = {
  id: 'timeScaleAdjust',
  beforeLayout: function(chart) {
    const xScale = chart.scales.x;
    if (!xScale || xScale.type !== 'time') return;
    
    const dataLength = chart.data.datasets[0]?.data?.length || 0;
    if (dataLength === 0) return;
    
    // Get the time range from data
    const firstPoint = chart.data.datasets[0].data[0];
    const lastPoint = chart.data.datasets[0].data[dataLength - 1];
    const timeRange = lastPoint.x - firstPoint.x;
    
    // Calculate optimal maxTicksLimit based on chart width and data density
    // Use canvas width if available, otherwise estimate
    const chartWidth = chart.canvas ? chart.canvas.width : (chart.width || 400);
    const minLabelWidth = 70; // Minimum width needed for a timestamp label (with rotation)
    const maxTicks = Math.max(5, Math.floor(chartWidth / minLabelWidth));
    
    // Adjust ticks configuration based on data density
    if (dataLength > 200) {
      xScale.options.ticks.maxTicksLimit = Math.min(8, maxTicks);
      xScale.options.ticks.maxRotation = 45;
    } else if (dataLength > 100) {
      xScale.options.ticks.maxTicksLimit = Math.min(10, maxTicks);
      xScale.options.ticks.maxRotation = 30;
    } else if (dataLength > 50) {
      xScale.options.ticks.maxTicksLimit = Math.min(12, maxTicks);
      xScale.options.ticks.maxRotation = 15;
    } else {
      xScale.options.ticks.maxTicksLimit = Math.min(15, maxTicks);
      xScale.options.ticks.maxRotation = 0;
    }
    
    // Adjust time unit and step size based on time range
    if (timeRange > 3600000) { // > 1 hour
      xScale.options.time.unit = 'minute';
      xScale.options.time.stepSize = Math.max(5, Math.floor(timeRange / 600000));
    } else if (timeRange > 300000) { // > 5 minutes
      xScale.options.time.unit = 'minute';
      xScale.options.time.stepSize = Math.max(1, Math.floor(timeRange / 300000));
    } else {
      xScale.options.time.unit = 'second';
      // Calculate step size to show reasonable number of ticks
      const desiredTicks = xScale.options.ticks.maxTicksLimit || 10;
      const stepSize = Math.max(5, Math.floor(timeRange / (desiredTicks * 1000)));
      xScale.options.time.stepSize = stepSize;
    }
  }
};

