export interface ProductMapping {
  type: 'product' | 'coffee' | 'kitchen' | 'alcoholic_drink';
  name: string;
  quantity?: number; // Sa copë merr nga stoku - vendoset nga stafi kur ngarkojnë furnizime
}

export interface ReceiptItem {
  name: string;
  quantity: number;
}

export interface MappingData {
  [key: string]: ProductMapping;
}
