// statistics.js
(function(){
  function bindStatsButtons(excelBtn, pdfBtn, printBtn, scope) {
    const chartCanvasId = scope === 'barangay' ? 'barangayPriorityChart' : 'residentPriorityChart';
    const listId = scope === 'barangay' ? 'topBarangaysList' : 'topResidentsList';

    if (excelBtn) {
      excelBtn.onclick = () => exportStatsTableToExcel(listId, scope === 'barangay' ? 'Barangay Priority' : 'Resident Priority');
    }
    if (pdfBtn) {
      pdfBtn.onclick = () => exportStatsToPDF(chartCanvasId, listId, scope === 'barangay' ? 'Barangay Priority' : 'Resident Priority');
    }
    if (printBtn) {
      printBtn.onclick = () => printStats(chartCanvasId, listId, scope === 'barangay' ? 'Barangay Priority' : 'Resident Priority');
    }
  }

  function exportStatsTableToExcel(listContainerId, title) {
    const container = document.getElementById(listContainerId);
    if (!container) return;
    const tempTable = document.createElement('table');
    const rows = container.querySelectorAll('li');
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>${title}</th><th>Value</th></tr>`;
    tempTable.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(li => {
      const name = li.querySelector('.pl-name')?.textContent || '';
      const value = li.querySelector('.pl-value')?.textContent || '';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${name}</td><td>${value}</td>`;
      tbody.appendChild(tr);
    });
    tempTable.appendChild(tbody);

    if (window.jQuery) {
      const $ = window.jQuery;
      $(tempTable).DataTable({
        dom: 'Bfrtip',
        buttons: [ { extend: 'excelHtml5', title } ],
        destroy: true
      });
      $(tempTable).DataTable().button('.buttons-excel').trigger();
      $(tempTable).DataTable().destroy();
    }
  }

  function exportStatsToPDF(chartCanvasId, listContainerId, title) {
    const chartCanvas = document.getElementById(chartCanvasId);
    const listContainer = document.getElementById(listContainerId);
    if (!chartCanvas || !listContainer) {
      if (typeof showError === 'function') {
        showError('Chart or data not found for PDF export');
      }
      return;
    }

    try {
      // Try to use jsPDF if available for automatic download
      if (typeof window.jsPDF !== 'undefined') {
        generateStatsPDF(chartCanvas, listContainer, title);
        return;
      }

      // Fallback: Try to use DataTables PDF export if available
      const tempTable = createTempTableForStats(listContainer, title);
      if (window.jQuery && tempTable) {
        const dt = $(tempTable).DataTable({
          dom: 'Bfrtip',
          buttons: [{
            extend: 'pdfHtml5',
            title: title,
            orientation: 'landscape',
            pageSize: 'A4',
            customize: function(doc) {
              // Add chart image to PDF
              const chartDataURL = chartCanvas.toDataURL('image/png');
              doc.content.unshift({
                image: chartDataURL,
                width: 500,
                alignment: 'center',
                margin: [0, 0, 0, 20]
              });
              
              // Style the document
              doc.pageMargins = [20, 40, 20, 30];
              doc.styles.tableHeader = { bold: true, fillColor: '#f1f5f9' };
            }
          }],
          destroy: true
        });
        
        // Trigger PDF download
        dt.button('.buttons-pdf').trigger();
        dt.destroy();
        
        // Clean up temp table
        if (tempTable.parentNode) {
          tempTable.parentNode.removeChild(tempTable);
        }
        
        if (typeof showSuccess === 'function') {
          showSuccess('PDF download initiated!');
        }
        return;
      }

      // Final fallback: Print dialog with instructions
      printStats(chartCanvasId, listContainerId, title, true);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      // Fallback to print method
      printStats(chartCanvasId, listContainerId, title, true);
    }
  }

  function generateStatsPDF(chartCanvas, listContainer, title) {
    try {
      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const config = window.EXPORT_CONFIG || {
        header: {
          title: 'RELIEF GOODS DELIVERY RECEIPT',
          subtitle: 'Municipal Social Welfare and Development Office',
          address: 'LGU Polangui, Polangui, Albay',
          contact: '0945 357 0566'
        }
      };
      
      // Add header
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(config.header.title, pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(config.header.subtitle, pageWidth / 2, 28, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`${config.header.address} | ${config.header.contact}`, pageWidth / 2, 34, { align: 'center' });
      
      doc.setFont(undefined, 'bold');
      doc.text(`${title.toUpperCase()} REPORT`, pageWidth / 2, 42, { align: 'center' });
      
      // Add chart image
      const chartDataURL = chartCanvas.toDataURL('image/png');
      const imgWidth = 120;
      const imgHeight = 80;
      const xPos = (pageWidth - imgWidth) / 2;
      doc.addImage(chartDataURL, 'PNG', xPos, 50, imgWidth, imgHeight);
      
      // Add table data
      const rows = listContainer.querySelectorAll('li');
      const tableData = [];
      tableData.push(['Name', 'Value']); // Header
      
      rows.forEach(li => {
        const name = li.querySelector('.pl-name')?.textContent || '';
        const value = li.querySelector('.pl-value')?.textContent || '';
        tableData.push([name, value]);
      });
      
      if (doc.autoTable && tableData.length > 1) {
        doc.autoTable({
          head: [tableData[0]],
          body: tableData.slice(1),
          startY: 140,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
          theme: 'grid'
        });
      }
      
      // Add footer
      const currentDate = new Date().toLocaleString();
      const finalY = doc.autoTable ? doc.autoTable.previous.finalY + 20 : 160;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated on: ${currentDate}`, pageWidth - 10, finalY, { align: 'right' });
      
      // Generate filename and download
      const dateStr = new Date().toISOString().split('T')[0];
      const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanTitle}_${dateStr}.pdf`;
      
      doc.save(filename);
      
      if (typeof showSuccess === 'function') {
        showSuccess(`PDF file "${filename}" downloaded successfully!`);
      }
      
    } catch (error) {
      console.error('jsPDF generation failed:', error);
      // Fallback to print dialog
      printStats(chartCanvas.id, listContainer.id, title, true);
    }
  }

  function createTempTableForStats(listContainer, title) {
    const tempTable = document.createElement('table');
    tempTable.style.display = 'none';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>Name</th><th>Value</th></tr>`;
    tempTable.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    const rows = listContainer.querySelectorAll('li');
    
    rows.forEach(li => {
      const name = li.querySelector('.pl-name')?.textContent || '';
      const value = li.querySelector('.pl-value')?.textContent || '';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${name}</td><td>${value}</td>`;
      tbody.appendChild(tr);
    });
    
    tempTable.appendChild(tbody);
    document.body.appendChild(tempTable);
    
    return tempTable;
  }

  function printStats(chartCanvasId, listContainerId, title, isPDF = false) {
    const chartCanvas = document.getElementById(chartCanvasId);
    const listContainer = document.getElementById(listContainerId);
    if (!chartCanvas || !listContainer) return;

    // Build table from list data
    const rows = listContainer.querySelectorAll('li');
    let tableHtml = '<table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody>';
    rows.forEach(li => {
      const name = li.querySelector('.pl-name')?.textContent || '';
      const value = li.querySelector('.pl-value')?.textContent || '';
      tableHtml += `<tr><td>${name}</td><td>${value}</td></tr>`;
    });
    tableHtml += '</tbody></table>';

    // Get chart as image
    const dataUrl = chartCanvas.toDataURL('image/png');
    
    // Build clean content using standardized template
    const bodyHTML = `
      <div class="section">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="${dataUrl}" style="max-width:100%; height:auto; border:1px solid #e5e7eb; border-radius:4px;" alt="Statistics Chart"/>
        </div>
      </div>
      <div class="section">
        <div class="small" style="font-weight:700;margin-bottom:8px;">${title} Data</div>
        ${tableHtml}
      </div>
    `;

    // Use the buildA4PrintHTML function from app.js if available
    if (typeof window.buildA4PrintHTML === 'function' && typeof window.openPrintA4 === 'function') {
      const pageHTML = window.buildA4PrintHTML({
        title: title || 'STATISTICS REPORT',
        subtitle: 'Municipal Social Welfare and Development Office',
        bodyHTML: bodyHTML,
        footerHTML: `<div class="small">This is an official statistics report. Generated on ${new Date().toLocaleString()}.</div>`
      });
      window.openPrintA4(pageHTML);
    } else {
      // Fallback using generateCleanExportHTML if available
      if (typeof window.generateCleanExportHTML === 'function') {
        const cleanHTML = window.generateCleanExportHTML(
          `${title} Report`,
          bodyHTML,
          { 
            reportTitle: `${title.toUpperCase()} REPORT`,
            includeSignatures: false
          }
        );
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          if (typeof showError === 'function') {
            showError('Popup blocked. Please allow popups to ' + (isPDF ? 'export PDF' : 'print') + '.');
          }
          return;
        }
        
        printWindow.document.write(cleanHTML);
        printWindow.document.close();
        printWindow.focus();
        
        if (isPDF) {
          // Show instructions for PDF
          setTimeout(() => {
            if (typeof showSuccess === 'function') {
              showSuccess('Print window opened! Use Ctrl+P and select "Save as PDF" to download the PDF.');
            }
            try {
              printWindow.print();
            } catch (e) {
              console.warn('Print dialog failed:', e);
            }
          }, 500);
        } else {
          // Auto-print for regular print
          setTimeout(() => {
            try {
              printWindow.print();
              setTimeout(() => printWindow.close(), 1000);
            } catch (e) {
              console.warn('Print failed:', e);
              printWindow.close();
            }
          }, 500);
        }
      } else {
        // Final fallback to basic method
        const win = window.open('', '_blank');
        if (!win) {
          if (typeof showError === 'function') {
            showError('Popup blocked. Please allow popups to ' + (isPDF ? 'export PDF' : 'print') + '.');
          }
          return;
        }
        
        const style = `<style>@page{size:A4;margin:15mm;}body{font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;}.header{text-align:center;border-bottom:2px solid #1e293b;padding-bottom:15px;margin-bottom:25px;}.chart-wrap{display:flex;justify-content:center;margin:20px 0;}table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{border:1px solid #cbd5e1;padding:8px;font-size:11px;}th{background:#f1f5f9;font-weight:bold;}</style>`;
        const headerHTML = `<div class="header"><h1>${title || 'STATISTICS REPORT'}</h1><p>Municipal Social Welfare and Development Office</p></div>`;
        const html = `${headerHTML}<div class="chart-wrap"><img src="${dataUrl}" style="max-width:600px;width:100%;"/></div>${tableHtml}<div style="text-align:right;margin-top:30px;font-size:10px;color:#6b7280;">Generated on ${new Date().toLocaleString()}</div>`;
        
        win.document.write(`<html><head><title>${title}</title>${style}</head><body>${html}</body></html>`);
        win.document.close();
        win.focus();
        
        setTimeout(() => {
          if (isPDF && typeof showSuccess === 'function') {
            showSuccess('Print window opened! Use Ctrl+P and select "Save as PDF" to download the PDF.');
          }
          try {
            win.print();
            if (!isPDF) {
              setTimeout(() => win.close(), 1000);
            }
          } catch (e) {
            console.warn('Print failed:', e);
            win.close();
          }
        }, 500);
      }
    }
  }

  window.setupStatsExports = function(type) {
    try {
      if (type === 'barangay') {
        const excelBtn = document.getElementById('exportBarangayExcelBtn');
        const pdfBtn = document.getElementById('exportBarangayPDFBtn');
        const printBtn = document.getElementById('printBarangayStatsBtn');
        bindStatsButtons(excelBtn, pdfBtn, printBtn, 'barangay');
      } else {
        const excelBtn = document.getElementById('exportResidentExcelBtn');
        const pdfBtn = document.getElementById('exportResidentPDFBtn');
        const printBtn = document.getElementById('printResidentStatsBtn');
        bindStatsButtons(excelBtn, pdfBtn, printBtn, 'resident');
      }
    } catch(_) {}
  }
})();
