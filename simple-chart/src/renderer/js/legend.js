// Function to create custom HTML legend
export function createCustomLegend(chart, legendContainerId) {
  const legendContainer = document.getElementById(legendContainerId);
  if (!legendContainer) return;
  
  // Clear existing legend
  legendContainer.innerHTML = '';
  
  const datasets = chart.data.datasets;
  
  datasets.forEach((dataset, index) => {
    const legendItem = document.createElement('div');
    legendItem.className = 'custom-legend-item';
    legendItem.dataset.index = index;
    
    const colorBox = document.createElement('div');
    colorBox.className = 'custom-legend-color';
    colorBox.style.backgroundColor = dataset.borderColor || dataset.backgroundColor;
    
    const label = document.createElement('span');
    label.className = 'custom-legend-label';
    label.textContent = dataset.label;
    
    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    
    // Check if dataset is hidden
    const meta = chart.getDatasetMeta(index);
    if (meta.hidden) {
      legendItem.classList.add('hidden');
    }
    
    // Add click handler to toggle dataset visibility
    legendItem.addEventListener('click', () => {
      const meta = chart.getDatasetMeta(index);
      meta.hidden = !meta.hidden;
      chart.update('none');
      
      // Update legend appearance
      if (meta.hidden) {
        legendItem.classList.add('hidden');
      } else {
        legendItem.classList.remove('hidden');
      }
    });
    
    legendContainer.appendChild(legendItem);
  });
}

