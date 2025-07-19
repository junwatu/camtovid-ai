// Types for GridDB client configuration
export interface GridDBConfig {
	griddbWebApiUrl: string;
	username: string;
	password: string;
}

// Types for container columns
export interface GridDBColumn {
	name: string;
	type: 'INTEGER' | 'STRING' | 'FLOAT' | 'BOOLEAN' | 'TIMESTAMP' | 'BLOB';
}

// Types for container data
export interface GridDBData {
	id: string | number;
	imageURL: string;
	prompt: string;
	generatedVideoURL: string;
}

// Types for SQL queries
export interface GridDBQuery {
	type: string;
	stmt: string;
}

// Types for API responses
export interface GridDBResponse {
	message?: string;
	response?: string;
}

// Types for GridDB errors
export class GridDBError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'GridDBError';
  }
}