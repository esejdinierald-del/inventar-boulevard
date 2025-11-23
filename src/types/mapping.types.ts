export interface ProductMapping {
  type: 'product' | 'coffee';
  name: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
}

export interface MappingData {
  [key: string]: ProductMapping;
}
