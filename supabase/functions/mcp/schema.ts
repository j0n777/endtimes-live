// Strict runtime validation of tool arguments against the JSON Schema subset the tools
// use (object, string, integer, enum, pattern, bounds). Unknown arguments and
// out-of-range values are rejected with a message the model can act on; nothing is
// coerced or silently replaced. The only normalisation is cosmetic and documented in the
// tool descriptions: surrounding spaces are trimmed and enum values match in any letter case.

export interface StringProp {
    type: 'string';
    description: string;
    enum?: readonly string[];
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    /** 'date' = a real calendar day written YYYY-MM-DD. */
    format?: 'date';
}

export interface IntegerProp {
    type: 'integer';
    description: string;
    minimum: number;
    maximum: number;
    default?: number;
}

export type Prop = StringProp | IntegerProp;

export interface ObjectSchema {
    type: 'object';
    properties: Record<string, Prop>;
    required?: readonly string[];
    additionalProperties: false;
}

export type ArgValue = string | number;
export type Args = Record<string, ArgValue>;

export type Validation = { ok: true; args: Args } | { ok: false; message: string };

export function isRealDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function checkString(name: string, prop: StringProp, raw: unknown): { value?: string; error?: string } {
    if (typeof raw !== 'string') return { error: `"${name}" must be a string.` };
    const value = raw.trim().replace(/\s+/g, ' ');
    if (prop.enum) {
        const match = prop.enum.find(e => e.toLowerCase() === value.toLowerCase());
        if (!match) return { error: `"${name}" value "${clip(value)}" is not accepted. Accepted values: ${prop.enum.join(', ')}.` };
        return { value: match };
    }
    if (prop.minLength !== undefined && value.length < prop.minLength) {
        return { error: `"${name}" must have at least ${prop.minLength} characters.` };
    }
    if (prop.maxLength !== undefined && value.length > prop.maxLength) {
        return { error: `"${name}" must have at most ${prop.maxLength} characters.` };
    }
    if (prop.format === 'date' && !isRealDate(value)) {
        return { error: `"${name}" must be a calendar date written as YYYY-MM-DD, for example 2026-11-01.` };
    }
    if (prop.pattern && !new RegExp(prop.pattern, 'u').test(value)) {
        return { error: `"${name}" value "${clip(value)}" has an invalid format. ${prop.description}` };
    }
    return { value };
}

function checkInteger(name: string, prop: IntegerProp, raw: unknown): { value?: number; error?: string } {
    if (typeof raw !== 'number' || !Number.isInteger(raw)) {
        return { error: `"${name}" must be an integer from ${prop.minimum} to ${prop.maximum}.` };
    }
    if (raw < prop.minimum || raw > prop.maximum) {
        return { error: `"${name}" must be from ${prop.minimum} to ${prop.maximum} (received ${raw}).` };
    }
    return { value: raw };
}

const clip = (s: string): string => (s.length > 60 ? `${s.slice(0, 60)}...` : s);

export function validateArgs(schema: ObjectSchema, input: unknown): Validation {
    if (input === undefined || input === null) input = {};
    if (typeof input !== 'object' || Array.isArray(input)) {
        return { ok: false, message: 'Arguments must be a JSON object.' };
    }
    const record = input as Record<string, unknown>;
    const known = Object.keys(schema.properties);
    const errors: string[] = [];

    const unknown = Object.keys(record).filter(k => !known.includes(k));
    if (unknown.length) {
        const accepted = known.length ? `Accepted arguments: ${known.join(', ')}.` : 'This tool takes no arguments.';
        errors.push(`Unknown argument${unknown.length > 1 ? 's' : ''}: ${unknown.map(clip).join(', ')}. ${accepted}`);
    }

    const args: Args = {};
    for (const name of known) {
        const prop = schema.properties[name];
        const raw = record[name];
        if (raw === undefined) {
            if (schema.required?.includes(name)) errors.push(`"${name}" is required.`);
            else if (prop.type === 'integer' && prop.default !== undefined) args[name] = prop.default;
            continue;
        }
        const res = prop.type === 'string' ? checkString(name, prop, raw) : checkInteger(name, prop, raw);
        if (res.error) errors.push(res.error);
        else if (res.value !== undefined) args[name] = res.value;
    }

    if (errors.length) return { ok: false, message: errors.join(' ') };
    return { ok: true, args };
}
