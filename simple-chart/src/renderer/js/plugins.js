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

// Plugin to add vertical hover line on chart
export const verticalHoverLinePlugin = {
  id: 'verticalHoverLine',
  afterInit: function(chart) {
    // Store mouse position
    chart.hoverLineX = null;
    
    // Get canvas element
    const canvas = chart.canvas;
    
    // Mouse move handler
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // // Convert CSS coordinates to canvas coordinates
      // // Account for device pixel ratio and canvas scaling
      // const scaleX = canvas.width / rect.width;
      // const scaleY = canvas.height / rect.height;
      // const canvasX = x * scaleX;
      // const canvasY = y * scaleY;
      
      // Check if mouse is within chart area
      const chartArea = chart.chartArea;
      if (x >= chartArea.left && x <= chartArea.right && 
          y >= chartArea.top && y <= chartArea.bottom) {
        chart.hoverLineX = x;
        chart.draw();
      } else {
        chart.hoverLineX = null;
        chart.draw();
      }
    };
    
    // Mouse leave handler
    const handleMouseLeave = () => {
      chart.hoverLineX = null;
      chart.draw();
    };
    
    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    // Store handlers for cleanup
    chart._verticalHoverLineHandlers = {
      mousemove: handleMouseMove,
      mouseleave: handleMouseLeave
    };
  },
  
  afterDraw: function(chart) {
    if (chart.hoverLineX === null) return;
    
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    
    // Draw vertical line at the stored canvas coordinate
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.beginPath();
    ctx.moveTo(chart.hoverLineX, chartArea.top);
    ctx.lineTo(chart.hoverLineX, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
  
  beforeDestroy: function(chart) {
    // Clean up event listeners
    const canvas = chart.canvas;
    if (canvas && chart._verticalHoverLineHandlers) {
      canvas.removeEventListener('mousemove', chart._verticalHoverLineHandlers.mousemove);
      canvas.removeEventListener('mouseleave', chart._verticalHoverLineHandlers.mouseleave);
      delete chart._verticalHoverLineHandlers;
    }
  }
};

