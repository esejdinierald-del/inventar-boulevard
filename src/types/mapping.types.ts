export interface ProductMapping {
  type: 'product' | 'coffee' | 'kitchen';
  name: string;
  quantity: number; // Sa copë merr nga stoku (psh 0.5 për "Kakao i vogel" = 0.5 bustine)
}

export interface ReceiptItem {
  name: string;
  quantity: number;
}

export interface MappingData {
  [key: string]: ProductMapping;
}
