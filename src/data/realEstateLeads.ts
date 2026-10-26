import { Lead } from '../types/crm';
import leadsRaw from './leadsData.json';

export const REAL_ESTATE_LEADS: Lead[] = (leadsRaw as unknown) as Lead[];
