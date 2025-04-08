import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private apiBaseUrl = 'https://devapi.research.profoundimpact.com/v1';

  // API key for x-api-key authentication
  private apiKey = 'YOUR API KEY'; // Replace with your actual API key

  constructor(private http: HttpClient) {}

  /**
   * Search grants using provided parameters
   * @param params Search parameters object
   * @returns Observable with grant search results
   */
  searchGrants(params: any): Observable<any> {
    const url = `${this.apiBaseUrl}/grant/search`;

    // Set the content type header and x-api-key header
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    });

    // Make the POST request with auth headers
    return this.http.post(url, params, { headers }).pipe(
      map((response: any) => response),
      catchError((error) => {
        console.error('Error searching grants:', error);
        throw error;
      })
    );
  }

  /**
   * Helper method for making generic GET requests
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Observable with response
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    const url = `${this.apiBaseUrl}/${endpoint}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    });

    return this.http.get<T>(url, { params, headers }).pipe(
      catchError((error) => {
        console.error(`Error getting ${endpoint}:`, error);
        throw error;
      })
    );
  }

  /**
   * Helper method for making generic POST requests
   * @param endpoint API endpoint
   * @param body Request body
   * @returns Observable with response
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.apiBaseUrl}/${endpoint}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    });

    return this.http.post<T>(url, body, { headers }).pipe(
      catchError((error) => {
        console.error(`Error posting to ${endpoint}:`, error);
        throw error;
      })
    );
  }

  // Add a new method for uploading files
  uploadFile(url: string, file: File): Observable<any> {
    // For direct PUT to S3 or similar storage, we don't need to use JSON
    // We send the file directly without additional headers
    return this.http.put(url, file, {
      headers: new HttpHeaders({
        'Content-Type': file.type,
      }),
    });
  }
}
