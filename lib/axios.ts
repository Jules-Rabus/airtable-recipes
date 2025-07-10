import axios from 'axios';

const AirtableClient = axios.create({
    baseURL: `https://api.airtable.com/v0/${process.env.NEXT_AIRTABLE_BASE_ID}/`,
    headers: {
        Authorization: `Bearer ${process.env.NEXT_AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
    },
});

export interface GetRecordsOptions {
  maxRecords?: string
  view?: string
  filterByFormula?: string
  sort?: Array<{ field: string; direction: string }>
}

export const getRecords = async (tableName: string, options: GetRecordsOptions = {}) => {
    try {
        const params = new URLSearchParams();
        
        if (options.maxRecords) params.append('maxRecords', options.maxRecords);
        if (options.view) params.append('view', options.view);
        if (options.filterByFormula) params.append('filterByFormula', options.filterByFormula);
        if (options.sort) {
            options.sort.forEach(sort => {
                params.append('sort[0][field]', sort.field);
                params.append('sort[0][direction]', sort.direction);
            });
        }

        const response = await AirtableClient.get(`${tableName}?${params}`);
        return response.data?.records || [];
    } catch (err) {
        const error = err as unknown;
        if (axios.isAxiosError(error)) {
            console.error('Error fetching records:', error.response?.data || error.message);
        } else {
            console.error('Error fetching records:', error);
        }
        throw error;
    }
};

export const getRecord = async (tableName: string, recordId: string) => {
    try {
        const response = await AirtableClient.get(`${tableName}/${recordId}`);
        return response.data;
    } catch (err) {
        const error = err as unknown;
        if (axios.isAxiosError(error)) {
            console.error('Error fetching record:', error.response?.data || error.message);
        } else {
            console.error('Error fetching record:', error);
        }
        throw error;
    }
};

export const createRecord = async (tableName: string, fields: Record<string, unknown>) => {
    try {
        const response = await AirtableClient.post(tableName, {
            fields: fields
        });
        return response.data;
    } catch (err) {
        const error = err as unknown;
        if (axios.isAxiosError(error)) {
            console.error('Error creating record:', error.response?.data || error.message);
        } else {
            console.error('Error creating record:', error);
        }
        throw error;
    }
};

export const createRecords = async (tableName: string, recordsArray: Array<Record<string, unknown>>) => {
    try {
        const records = recordsArray.map(fields => ({ fields }));
        const response = await AirtableClient.post(tableName, {
            records: records
        });
        return response.data;
    } catch (err) {
        const error = err as unknown;
        if (axios.isAxiosError(error)) {
            console.error('Error creating records:', error.response?.data || error.message);
        } else {
            console.error('Error creating records:', error);
        }
        throw error;
    }
};

export const updateRecord = async (tableName: string, recordId: string, fields: Record<string, unknown>) => {
    try {
        const response = await AirtableClient.patch(`${tableName}/${recordId}`, {
            fields: fields
        });
        return response.data;
    } catch (err) {
        const error = err as unknown;
        if (axios.isAxiosError(error)) {
            console.error('Error updating record:', error.response?.data || error.message);
        } else {
            console.error('Error updating record:', error);
        }
        throw error;
    }
};

export const deleteRecord = async (tableName: string, recordId: string) => {
    try {
        const response = await AirtableClient.delete(`${tableName}/${recordId}`);
        return response.data;
    } catch (err) {
        const error = err as unknown;
        if (axios.isAxiosError(error)) {
            console.error('Error deleting record:', error.response?.data || error.message);
        } else {
            console.error('Error deleting record:', error);
        }
        throw error;
    }
};

export default AirtableClient;