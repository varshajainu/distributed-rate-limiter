import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiDataService } from '../../services/api-data.service';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(...registerables); // Required for Chart.js 3+

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private statsSubscription!: Subscription;
  public chart: any;
  public lastUpdated: Date = new Date();

  // 1. Inject the service here
  constructor(private apiService: ApiDataService) {}

  ngOnInit(): void {
    this.initChart();
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }

  /*private initChart(): void {
    // Initialize chart configuration here
    this.chart = new Chart('chartCanvas', {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {}
    });
  }*/

 initChart() {
    Chart.register(...registerables); // Register plugins
    this.chart = new Chart('canvas', {
      type: 'bar',
      data: {
        labels: [], 
        datasets: [{
          label: 'Requests per IP (Last 1 min)',
          data: [],
          backgroundColor: 'rgba(66, 133, 244, 0.7)',
          borderColor: '#4285F4',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  /*private startPolling(): void {
    // Poll API data and update chart
    this.statsSubscription = this.apiService.getStats().subscribe(
      (data: any) => {
        // Update chart with new data
      }
    );
  }*/

    startPolling() {
    this.statsSubscription = this.apiService.getSecurityStats().subscribe(response => {
      // Mapping the Java Map (IP -> Count) to Chart arrays
      const ipLabels = Object.keys(response.activeRequests); 
      const requestCounts = Object.values(response.activeRequests); 

      this.chart.data.labels = ipLabels;
      this.chart.data.datasets[0].data = requestCounts;
      this.chart.update(); // Refreshes the visual bars automatically
      this.lastUpdated = new Date();
    });
  }

  // "Reset Redis" Button Logic
  resetStats() {
    if(confirm("Are you sure you want to clear all rate limit data?")) {
      this.apiService.resetRateLimits().subscribe(() => {
        alert("Redis cache cleared successfully!");
      });
    }
  }

  // "Download PDF" Button Logic
  downloadReport() {
    const doc = new jsPDF();
    doc.text("Security Report: Rate Limiter Stats", 14, 15);
    
    // Grabs data currently shown in your Chart/Table
    const tableData = this.chart.data.labels.map((label: string, i: number) => [
      label, 
      this.chart.data.datasets[0].data[i],
      this.chart.data.datasets[0].data[i] > 10 ? 'Blocked' : 'Active'
    ]);

    autoTable(doc, {
      head: [['IP Address', 'Requests/Min', 'Status']],
      body: tableData,
      startY: 25
    });

    doc.save(`Security_Report_${this.lastUpdated.getTime()}.pdf`);
  }

  
}