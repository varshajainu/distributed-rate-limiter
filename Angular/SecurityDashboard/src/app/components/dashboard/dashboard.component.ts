import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiDataService } from '../../services/api-data.service';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private statsSubscription!: Subscription;
  public chart: any;
  public lastUpdated: Date = new Date();

  constructor(private apiService: ApiDataService) {}

  ngOnInit(): void {
    // Keep empty or for non-DOM logic
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }

  initChart() {
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

  startPolling() {
    this.statsSubscription = this.apiService.getSecurityStats().subscribe(response => {
      const ipLabels = Object.keys(response.activeRequests); 
      const requestCounts = Object.values(response.activeRequests); 

      if (this.chart) {
        this.chart.data.labels = ipLabels;
        this.chart.data.datasets[0].data = requestCounts;
        this.chart.update(); 
        this.lastUpdated = new Date();
      }
    });
  }

  resetStats() {
    if(confirm("Are you sure you want to clear all rate limit data?")) {
      this.apiService.resetRateLimits().subscribe(() => {
        alert("Redis cache cleared successfully!");
      });
    }
  }

  downloadReport() {
    const doc = new jsPDF();
    doc.text("Security Report: Rate Limiter Stats", 14, 15);
    
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