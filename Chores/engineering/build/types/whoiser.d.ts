declare module 'whoiser' {
  export interface WhoisSearchResult {
    [key: string]: any;
    __raw?: string;
    error?: string | string[];
    text?: string[];
    'Name Server'?: string[];
    'Domain Status'?: string[];
  }

  export interface WhoisOptions {
    raw?: boolean;
    follow?: number;
    timeout?: number;
  }

  export function domain(domain: string, options?: WhoisOptions): Promise<WhoisSearchResult>;

  export function ip(ip: string, options?: WhoisOptions): Promise<WhoisSearchResult>;

  export function asn(asn: string | number, options?: WhoisOptions): Promise<WhoisSearchResult>;
}
