import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { AuditInput, AuditResult, ToolInput } from './types';
import { runAudit } from './auditEngine';

// Interfaces for DB records
export interface AuditRecord {
  id: string;
  createdAt: string;
  teamSize: number;
  useCase: string;
  toolsInput: ToolInput[];
  results: AuditResult;
  leadEmail?: string;
  leadName?: string;
  leadRole?: string;
  leadCompany?: string;
  aiSummary?: string;
  isPublic: boolean;
}

// Env configuration checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseServiceKey.length > 0;

// Initialize Supabase client if credentials exist
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Mock database file path
const MOCK_DB_PATH = path.join(process.cwd(), 'lib', 'mockDb.json');

// Initialize empty mock DB file if it doesn't exist
function initMockDb() {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify({}, null, 2), 'utf-8');
  }
}

// Read from mock DB file
function readMockDb(): Record<string, AuditRecord> {
  initMockDb();
  try {
    const data = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (e) {
    console.error('Error reading mock database:', e);
    return {};
  }
}

// Write to mock DB file
function writeMockDb(db: Record<string, AuditRecord>) {
  initMockDb();
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing mock database:', e);
  }
}

/**
 * Creates a unique random UUID for the mock database.
 */
function generateUUID(): string {
  return 'audit_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Inserts a new audit record.
 */
export async function createAudit(input: AuditInput): Promise<string> {
  const calculatedResults = runAudit(input);
  const auditId = generateUUID();
  const createdAt = new Date().toISOString();

  const record: AuditRecord = {
    id: auditId,
    createdAt,
    teamSize: input.teamSize,
    useCase: input.primaryUseCase,
    toolsInput: input.tools,
    results: calculatedResults,
    isPublic: false
  };

  if (isSupabaseConfigured && supabase) {
    console.log('[DB] Storing audit record to Supabase...');
    const { error } = await supabase
      .from('audits')
      .insert({
        id: auditId,
        created_at: createdAt,
        team_size: input.teamSize,
        use_case: input.primaryUseCase,
        tools_input: input.tools,
        results: calculatedResults,
        is_public: false
      })
      .select();

    if (error) {
      console.error('[DB] Supabase error during insert, falling back to mock file:', error);
      // Fallback inside method to make sure we don't block the user
      const db = readMockDb();
      db[auditId] = record;
      writeMockDb(db);
    }
  } else {
    console.log('[DB] Supabase not configured. Storing audit in local mockDb.json...');
    const db = readMockDb();
    db[auditId] = record;
    writeMockDb(db);
  }

  return auditId;
}

/**
 * Fetches an audit record by ID.
 */
export async function getAudit(id: string): Promise<AuditRecord | null> {
  if (isSupabaseConfigured && supabase) {
    console.log(`[DB] Fetching audit ${id} from Supabase...`);
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        createdAt: data.created_at,
        teamSize: data.team_size,
        useCase: data.use_case,
        toolsInput: data.tools_input,
        results: data.results,
        leadEmail: data.lead_email,
        leadName: data.lead_name,
        leadRole: data.lead_role,
        leadCompany: data.lead_company,
        aiSummary: data.ai_summary,
        isPublic: data.is_public
      };
    }
    console.error(`[DB] Supabase error fetching audit ${id}:`, error);
  }

  // Fallback to mock DB
  console.log(`[DB] Fetching audit ${id} from local mockDb.json...`);
  const db = readMockDb();
  return db[id] || null;
}

/**
 * Updates the audit record with lead details and optional generated AI summary.
 */
export async function updateAuditLead(
  id: string,
  leadData: {
    email: string;
    name?: string;
    role?: string;
    company?: string;
    aiSummary?: string;
  }
): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    console.log(`[DB] Updating lead info for audit ${id} in Supabase...`);
    const { error } = await supabase
      .from('audits')
      .update({
        lead_email: leadData.email,
        lead_name: leadData.name,
        lead_role: leadData.role,
        lead_company: leadData.company,
        ai_summary: leadData.aiSummary
      })
      .eq('id', id);

    if (!error) {
      // Also store in leads helper table if exists
      try {
        await supabase.from('leads').insert({
          email: leadData.email,
          name: leadData.name,
          role: leadData.role,
          company: leadData.company,
          audit_id: id
        });
      } catch (e) {
        console.error('[DB] Failed to insert secondary leads table, ignoring.', e);
      }

      return true;
    }
    console.error(`[DB] Supabase update lead failed:`, error);
  }

  // Fallback to mock DB
  console.log(`[DB] Updating lead info for audit ${id} in local mockDb.json...`);
  const db = readMockDb();
  if (db[id]) {
    db[id] = {
      ...db[id],
      leadEmail: leadData.email,
      leadName: leadData.name,
      leadRole: leadData.role,
      leadCompany: leadData.company,
      aiSummary: leadData.aiSummary || db[id].aiSummary
    };
    writeMockDb(db);
    return true;
  }
  return false;
}

/**
 * Toggles the public share visibility of an audit.
 */
export async function toggleAuditPublic(id: string, isPublic: boolean): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    console.log(`[DB] Toggling audit ${id} public isPublic=${isPublic} in Supabase...`);
    const { error } = await supabase
      .from('audits')
      .update({ is_public: isPublic })
      .eq('id', id);

    if (!error) return true;
    console.error(`[DB] Supabase toggle public failed:`, error);
  }

  // Fallback to mock DB
  console.log(`[DB] Toggling audit ${id} public isPublic=${isPublic} in local mockDb.json...`);
  const db = readMockDb();
  if (db[id]) {
    db[id].isPublic = isPublic;
    writeMockDb(db);
    return true;
  }
  return false;
}
