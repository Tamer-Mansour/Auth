import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RedirectService {
  private redirectUrl: string | null = null;

  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
    console.log("🚀 ~ RedirectService ~ setRedirectUrl ~ url:", url)
  }

  getRedirectUrl(): string | null {
    const url = this.redirectUrl;
    console.log("🚀 ~ RedirectService ~ getRedirectUrl ~ url:", url)
    this.redirectUrl = null;
    return url;
  }

  clearRedirectUrl(): void {
    this.redirectUrl = null;
  }
}
