import { NextRequest, NextResponse } from 'next/server';
import { createGridDBClient } from '../../../lib/griddb';
import { GridDBData, GridDBError, GridDBConfig } from '../../../lib/types/griddb.types';
import { generateRandomID } from '../../../lib/randomId';

export const dynamic = 'force-dynamic';

const dbConfig: GridDBConfig = {
    griddbWebApiUrl: process.env.GRIDDB_WEBAPI_URL || '',
    username: process.env.GRIDDB_USERNAME || '',
    password: process.env.GRIDDB_PASSWORD || '',
}

const dbClient = createGridDBClient(dbConfig);

// Initialize container at module load
let containerInitialized = false;
const initializeContainer = async () => {
  if (!containerInitialized) {
    try {
      await dbClient.createContainer();
      containerInitialized = true;
      console.log('GridDB container initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GridDB container:', error);
      throw error;
    }
  }
};

// Initialize immediately when module loads
initializeContainer().catch(error => {
  console.error('Container initialization failed at startup:', error);
});

export async function POST(request: NextRequest) {
  try {
    // Ensure container is initialized before processing request
    await initializeContainer();
    
    const body = await request.json();
    const { imageURL, prompt, generatedVideoURL } = body;

    // Validate required fields
    if (!imageURL || !prompt || !generatedVideoURL) {
      return NextResponse.json({ 
        error: 'Missing required fields. You need to provide an image, a prompt, and a generated video URL.' 
      }, { status: 400 });
    }

    // Check for GridDB configuration
    if (!dbConfig.griddbWebApiUrl || !dbConfig.username || !dbConfig.password) {
      console.error('Missing GridDB environment variables');
      return NextResponse.json({ 
        error: 'GridDB configuration not found. Please check your environment variables.' 
      }, { status: 500 });
    }
    
    // Prepare data for insertion
    const data: GridDBData = {
      id: generateRandomID(),
      imageURL,
      prompt,
      generatedVideoURL
    };

    console.log('Saving data to GridDB:', {
      id: data.id,
      imageURL: data.imageURL,
      prompt: data.prompt,
      generatedVideoURL: data.generatedVideoURL
    });

    // Insert data into GridDB
    const result = await dbClient.insertData({ data });

    return NextResponse.json({ 
      success: true,
      message: 'Data saved successfully to GridDB',
      id: data.id,
      result: result
    });

  } catch (error) {
    console.error('Save data error:', error);
    
    if (error instanceof GridDBError) {
      return NextResponse.json({ 
        error: 'GridDB operation failed',
        details: error.message,
        code: error.code
      }, { status: error.status || 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to save data to GridDB. Please check your configuration and try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Add GET method to retrieve data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = searchParams.get('limit') || '10';

    // Check for GridDB configuration
    if (!dbConfig.griddbWebApiUrl || !dbConfig.username || !dbConfig.password) {
      console.error('Missing GridDB environment variables');
      return NextResponse.json({ 
        error: 'GridDB configuration not found. Please check your environment variables.' 
      }, { status: 500 });
    }

    let query;
    if (id) {
      // Search for specific ID
      query = {
        type: 'sql-select',
        stmt: `SELECT * FROM genvoiceai WHERE id = ${parseInt(id)}`
      };
    } else {
      // Get recent entries
      query = {
        type: 'sql-select',
        stmt: `SELECT * FROM genvoiceai ORDER BY id DESC LIMIT ${parseInt(limit)}`
      };
    }

    const result = await dbClient.searchData([query]);
    // Transform GridDB array response to object format
    let transformedData = [];
    if (result && Array.isArray(result) && result.length > 0) {
      const queryResult = result[0];
      if (queryResult && queryResult.results && Array.isArray(queryResult.results)) {
        transformedData = queryResult.results.map((row: any[]) => ({
          id: row[0],
          imageURL: row[1],
          prompt: row[2],
          generatedVideoURL: row[3]
        }));
      }
    }

    return NextResponse.json({ 
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Retrieve data error:', error);
    
    if (error instanceof GridDBError) {
      return NextResponse.json({ 
        error: 'GridDB operation failed',
        details: error.message,
        code: error.code
      }, { status: error.status || 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to retrieve data from GridDB. Please check your configuration and try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}