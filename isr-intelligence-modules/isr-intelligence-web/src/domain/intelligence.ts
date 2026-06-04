export interface Intelligence {
  id: string;
  header: string;
  description: string;
  templateId: string;
  createdAt: string; // ISO timestamp
  tags: string[];
}

export interface IntelligenceQuery {
  q?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
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
