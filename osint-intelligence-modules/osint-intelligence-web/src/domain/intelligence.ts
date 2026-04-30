export interface Intelligence {
  id: string;
  header: string;
  description: string;
  templateId: string;
  createdAt: string;
  tags: string[];
}

export interface IntelligenceCreateDto {
  header: string;
  description: string;
  templateId: string;
  tags?: string[];
}

export interface IntelligenceUpdateDto extends IntelligenceCreateDto {
  id: string;
}

export interface IntelligenceQuery {
  q?: string;
  tags?: string[];
  templateId?: string;
  page?: number;
  pageSize?: number;
}

export interface IntelligenceQueryResult {
  items: Intelligence[];
  total: number;
  page: number;
  pageSize: number;
}
