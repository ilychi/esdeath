declare module 'dns2' {
  export interface DnsResponse {
    questions: Array<{ name: string; type: number; class: number }>;
    answers: Array<{
      name: string;
      type: number;
      class: number;
      ttl: number;
      data: string | any;
    }>;
    authorities: Array<any>;
    additionals: Array<any>;
  }

  export type PacketQuestion = 
    | 'A' 
    | 'AAAA' 
    | 'NS' 
    | 'MX' 
    | 'TXT' 
    | 'CNAME' 
    | 'SOA' 
    | 'PTR' 
    | 'SRV';

  export interface DnsResolver {
    (name: string, type: PacketQuestion): Promise<DnsResponse>;
  }

  export interface DOHClientOptions {
    dns: string;
    http?: boolean;
  }

  export function DOHClient(options: DOHClientOptions): DnsResolver;

  const dns2: {
    DOHClient: typeof DOHClient;
    DnsResponse: typeof DnsResponse;
    PacketQuestion: typeof PacketQuestion;
    DnsResolver: typeof DnsResolver;
  };

  export default dns2;
}
