import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiDataService {
  private apiUrl = 'http://localhost:8080/api/stats'; // Your Spring Boot URL

  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
  // Polls the API every 5 seconds to get real-time stats
  getSecurityStats(): Observable<any> {
    return timer(0, 5000).pipe(
      switchMap(() => this.http.get(this.apiUrl).pipe(
        // This "catches" the 429 error and prevents the app from breaking
      catchError(error => {
        if (error.status === 429) {
          console.log("Rate limit exceeded, but keeping dashboard active.");
        }
        // Return the current local data or the error object so the UI can see it
        return of(error.error); 
      })
      ))
    );
  }

  resetRateLimits(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reset`);
  }

  checkRedisStatus(): Observable<any> {
  return this.http.get(`${this.apiUrl}/redis-health`);
}
}