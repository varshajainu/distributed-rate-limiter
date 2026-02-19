import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiDataService } from '../../services/api-data.service';
import { Chart, registerables } from 'chart.js';
import { Subscription, interval } from 'rxjs'; // Added interval
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { isPlatformBrowser } from '@angular/common';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private statsSubscription!: Subscription;
  private healthSubscription!: Subscription; // Subscription for health checks
  public chart: any;
  public lastUpdated: Date = new Date();
  public blockedIPs: any[] = [];
  public redisOnline: boolean = true; // Redis status tracker

  constructor(
    private apiService: ApiDataService,
    private cdr: ChangeDetectorRef,
  @Inject(PLATFORM_ID) private platformId: Object
) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    
      if(isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
        this.initChart();
      this.startPolling();
      this.startHealthCheck(); // Start monitoring Redis status
      
    }, 100);
  }
}

  ngOnDestroy() {
    if (this.statsSubscription) this.statsSubscription.unsubscribe();
    if (this.healthSubscription) this.healthSubscription.unsubscribe();
    if (this.chart) this.chart.destroy();
  }

  initChart() {
    //const canvasElement = document.getElementById('canvas');
    if (isPlatformBrowser(this.platformId)) {
    const canvasElement = document.getElementById('canvas');

    if (!canvasElement) return;

    this.chart = new Chart(canvasElement as HTMLCanvasElement, {
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
}

  startHealthCheck() {
    // Check Redis health every 5 seconds
      interval(5000).subscribe(() => {
      this.apiService.checkRedisStatus().subscribe({
        next: (res) => {
          this.redisOnline = res.status === 'UP';
          this.cdr.detectChanges();
        },
        error: () => {
          this.redisOnline = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  startPolling() {
    this.statsSubscription = interval(3000).subscribe(() => {
      this.apiService.getSecurityStats().subscribe(response => {
        if (!response || !response.activeRequests) return;

        const ipLabels = Object.keys(response.activeRequests); 
        const requestCounts = Object.values(response.activeRequests); 

        if (this.chart) {
          this.chart.data.labels = ipLabels;
          this.chart.data.datasets[0].data = requestCounts;
          this.chart.update(); 
        }

        // Update Blocklist based on your test threshold (2) or production (10)
        this.blockedIPs = Object.keys(response.activeRequests)
          .filter(ip => Number(response.activeRequests[ip]) >= 2) 
          .map(ip => ({
            address: ip,
            count: response.activeRequests[ip],
            time: new Date()
          }));

        this.lastUpdated = new Date();
        this.cdr.markForCheck();
      });
    });
  }

  resetStats() {
    if(confirm("Are you sure you want to clear all security blocks?")) {
      this.apiService.resetRateLimits().subscribe({
        next: () => {
          alert("Security logs cleared successfully!");
          this.blockedIPs = [];
          this.cdr.markForCheck();
        },
        error: (err) => console.error("Reset failed", err)
      });
    }
  }

  downloadReport() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Security Audit Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${this.lastUpdated.toLocaleString()}`, 14, 30);
    
    const auditData = this.blockedIPs.map(ip => [
      ip.address, 
      ip.count, 
      'HIGH RISK - BLOCKED',
      ip.time.toLocaleTimeString()
    ]);

    autoTable(doc, {
      head: [['Flagged IP Address', 'Req Count', 'Threat Level', 'Detected At']],
      body: auditData.length ? auditData : [['No threats detected', '-', 'SECURE', '-']],
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69] } 
    });

    doc.save(`Security_Audit_${this.lastUpdated.getTime()}.pdf`);
  }
}